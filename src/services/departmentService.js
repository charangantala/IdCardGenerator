import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SAMPLE_DEPARTMENTS } from '../utils/sampleData';

let mockDepartments = [...SAMPLE_DEPARTMENTS];

export const departmentService = {
  /**
   * Fetch departments strictly filtered by college_id (Rule 4)
   */
  async getDepartmentsByCollege(collegeId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('college_id', collegeId)
        .order('name');
      if (error) throw error;
      return data;
    }
    return mockDepartments.filter((d) => (d.college_id || 'mitc') === collegeId);
  },

  /**
   * Create department with mandatory college_id (Rule 4)
   */
  async createDepartment(collegeId, departmentData) {
    if (!collegeId) throw new Error('college_id is mandatory for tenant isolation');

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('departments')
        .insert([
          {
            college_id: collegeId,
            name: departmentData.name,
            code: departmentData.code.toUpperCase(),
            years: departmentData.years || 4,
            description: departmentData.description,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const newDept = {
      ...departmentData,
      id: `dept-${Date.now()}`,
      college_id: collegeId,
    };
    mockDepartments.push(newDept);
    return newDept;
  },

  /**
   * Update department strictly verifying college_id (Rule 4)
   */
  async updateDepartment(collegeId, deptId, updates) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('departments')
        .update({
          name: updates.name,
          code: updates.code,
          years: updates.years,
          description: updates.description,
        })
        .eq('id', deptId)
        .eq('college_id', collegeId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const idx = mockDepartments.findIndex(
      (d) => d.id === deptId && (d.college_id || 'mitc') === collegeId
    );
    if (idx !== -1) {
      mockDepartments[idx] = { ...mockDepartments[idx], ...updates };
      return mockDepartments[idx];
    }
    return null;
  },

  /**
   * Delete department strictly verifying college_id (Rule 4)
   */
  async deleteDepartment(collegeId, deptId) {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deptId)
        .eq('college_id', collegeId);
      if (error) throw error;
      return true;
    }

    const idx = mockDepartments.findIndex(
      (d) => d.id === deptId && (d.college_id || 'mitc') === collegeId
    );
    if (idx !== -1) mockDepartments.splice(idx, 1);
    return true;
  },
};

