import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SAMPLE_TEMPLATES } from '../utils/sampleData';

const MOCK_COLLEGES = [
  {
    id: 'mitc',
    name: 'MIT College of Technology',
    code: 'MITC',
    status: 'active',
    studentLimit: 1200,
    student_limit: 1200,
    validUntil: '2026-12-31',
    valid_until: '2026-12-31',
    template_config: SAMPLE_TEMPLATES.classicBlue,
  },
  {
    id: 'ait',
    name: 'Apex Institute of Technology',
    code: 'AIT',
    status: 'active',
    studentLimit: 850,
    student_limit: 850,
    validUntil: '2027-06-30',
    valid_until: '2027-06-30',
    template_config: SAMPLE_TEMPLATES.modernEmerald,
  },
  {
    id: 'sec',
    name: 'Stanford Engineering College',
    code: 'SEC',
    status: 'active',
    studentLimit: 2000,
    student_limit: 2000,
    validUntil: '2026-08-31',
    valid_until: '2026-08-31',
    template_config: SAMPLE_TEMPLATES.crimsonTech,
  },
];

export const collegeService = {
  /**
   * Fetch all colleges (Admin only)
   */
  async getColleges() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    return MOCK_COLLEGES;
  },

  /**
   * Fetch a single college by ID
   */
  async getCollegeById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    return MOCK_COLLEGES.find((c) => c.id === id) || null;
  },

  /**
   * Create a new college tenant (Admin only)
   */
  async createCollege(collegeData) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('colleges')
        .insert([
          {
            name: collegeData.name,
            code: collegeData.code.toUpperCase(),
            student_limit: collegeData.studentLimit || collegeData.student_limit,
            valid_until: collegeData.validUntil || collegeData.valid_until,
            status: collegeData.status || 'active',
            template_config: collegeData.template_config || SAMPLE_TEMPLATES.classicBlue,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    const newCollege = {
      ...collegeData,
      id: collegeData.code.toLowerCase(),
      template_config: SAMPLE_TEMPLATES.classicBlue,
    };
    MOCK_COLLEGES.unshift(newCollege);
    return newCollege;
  },

  /**
   * Update college metadata (Admin only)
   */
  async updateCollege(id, updates) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('colleges')
        .update({
          name: updates.name,
          code: updates.code,
          student_limit: updates.studentLimit || updates.student_limit,
          valid_until: updates.validUntil || updates.valid_until,
          status: updates.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    const idx = MOCK_COLLEGES.findIndex((c) => c.id === id);
    if (idx !== -1) {
      MOCK_COLLEGES[idx] = { ...MOCK_COLLEGES[idx], ...updates };
      return MOCK_COLLEGES[idx];
    }
    return null;
  },

  /**
   * Delete college (Admin only)
   */
  async deleteCollege(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('colleges').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const idx = MOCK_COLLEGES.findIndex((c) => c.id === id);
    if (idx !== -1) MOCK_COLLEGES.splice(idx, 1);
    return true;
  },

  /**
   * Toggle suspended/active status
   */
  async toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    return this.updateCollege(id, { status: newStatus });
  },
};
