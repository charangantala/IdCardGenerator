import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SAMPLE_STUDENTS } from '../utils/sampleData';

let mockStudents = [...SAMPLE_STUDENTS];

export const studentService = {
  /**
   * Fetch students strictly filtered by college_id (Rule 4)
   */
  async getStudentsByCollege(collegeId, filters = {}) {
    if (!collegeId) throw new Error('college_id is required for tenant isolation');

    if (isSupabaseConfigured()) {
      let query = supabase
        .from('students')
        .select(`
          *,
          departments ( name, code )
        `)
        .eq('college_id', collegeId)
        .order('created_at', { ascending: false });

      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters.year && filters.year !== 'all') {
        query = query.eq('year', Number(filters.year));
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search?.trim()) {
        const s = filters.search.trim();
        query = query.or(`name.ilike.%${s}%,roll_no.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    // Mock filtering
    return mockStudents.filter((s) => {
      if ((s.college_id || 'mitc') !== collegeId) return false;
      if (filters.departmentId && s.department_id !== filters.departmentId) return false;
      if (filters.year && filters.year !== 'all' && Number(s.year) !== Number(filters.year)) return false;
      if (filters.status && filters.status !== 'all' && s.status !== filters.status) return false;
      if (filters.search?.trim()) {
        const q = filters.search.toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesRoll = (s.rollNo || s.roll_no)?.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll) return false;
      }
      return true;
    });
  },

  /**
   * Fetch student by ID strictly with college_id (Rule 4)
   */
  async getStudentById(collegeId, studentId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('students')
        .select('*, departments(name, code)')
        .eq('college_id', collegeId)
        .eq('id', studentId)
        .single();
      if (error) throw error;
      return data;
    }
    return (
      mockStudents.find(
        (s) => s.id === studentId && (s.college_id || 'mitc') === collegeId
      ) || null
    );
  },

  /**
   * Create student with mandatory college_id (Rule 4)
   */
  async createStudent(collegeId, studentData) {
    if (!collegeId) throw new Error('college_id is mandatory');

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            college_id: collegeId,
            department_id: studentData.department_id,
            year: Number(studentData.year) || 1,
            name: studentData.name,
            roll_no: studentData.rollNo || studentData.roll_no,
            dob: studentData.dob || null,
            gender: studentData.gender,
            blood_group: studentData.bloodGroup || studentData.blood_group,
            phone: studentData.phone,
            email: studentData.email,
            address: studentData.address,
            guardian_name: studentData.guardian_name,
            photo_url: studentData.photoUrl || studentData.photo_url,
            status: studentData.status || 'draft',
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const newStudent = {
      ...studentData,
      id: `stud-${Date.now()}`,
      college_id: collegeId,
      card_id: `card-${Date.now()}`,
    };
    mockStudents.unshift(newStudent);
    return newStudent;
  },

  /**
   * Update student details with college_id (Rule 4)
   */
  async updateStudent(collegeId, studentId, updates) {
    if (!collegeId) throw new Error('college_id is mandatory');

    if (isSupabaseConfigured()) {
      const payload = {
        name: updates.name,
        roll_no: updates.rollNo || updates.roll_no,
        year: Number(updates.year),
        dob: updates.dob,
        gender: updates.gender,
        blood_group: updates.bloodGroup || updates.blood_group,
        phone: updates.phone,
        email: updates.email,
        address: updates.address,
        guardian_name: updates.guardian_name,
      };

      if (updates.photoUrl || updates.photo_url) {
        payload.photo_url = updates.photoUrl || updates.photo_url;
      }
      if (updates.department_id) {
        payload.department_id = updates.department_id;
      }

      const { data, error } = await supabase
        .from('students')
        .update(payload)
        .eq('id', studentId)
        .eq('college_id', collegeId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const idx = mockStudents.findIndex(
      (s) => s.id === studentId && (s.college_id || 'mitc') === collegeId
    );
    if (idx !== -1) {
      mockStudents[idx] = { ...mockStudents[idx], ...updates };
      return mockStudents[idx];
    }
    return null;
  },

  /**
   * Update student approval status
   */
  async updateStatus(collegeId, studentId, status, rejectReason = null) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('students')
        .update({
          status,
          reject_reason: status === 'rejected' ? rejectReason : null,
        })
        .eq('id', studentId)
        .eq('college_id', collegeId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const idx = mockStudents.findIndex(
      (s) => s.id === studentId && (s.college_id || 'mitc') === collegeId
    );
    if (idx !== -1) {
      mockStudents[idx].status = status;
      mockStudents[idx].reject_reason = status === 'rejected' ? rejectReason : null;
      return mockStudents[idx];
    }
    return null;
  },

  /**
   * Delete student record
   */
  async deleteStudent(collegeId, studentId) {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('college_id', collegeId);
      if (error) throw error;
      return true;
    }

    const idx = mockStudents.findIndex(
      (s) => s.id === studentId && (s.college_id || 'mitc') === collegeId
    );
    if (idx !== -1) mockStudents.splice(idx, 1);
    return true;
  },

  /**
   * Upload student photo to Supabase Storage
   */
  async uploadPhoto(collegeId, studentId, base64DataUrl) {
    if (!isSupabaseConfigured()) {
      // In mock mode, base64 data URL works locally
      return base64DataUrl;
    }

    try {
      // Convert base64 data url to blob
      const res = await fetch(base64DataUrl);
      const blob = await res.blob();
      const filePath = `${collegeId}/${studentId || Date.now()}-photo.jpg`;

      const { data, error } = await supabase.storage
        .from('student-photos')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Storage upload failed:', err);
      return base64DataUrl; // fallback
    }
  },

  /**
   * Public Card Verification (uses public_card_verification safe view)
   */
  async verifyCard(cardId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('public_card_verification')
        .select('*')
        .eq('card_id', cardId)
        .single();
      if (error) return null;
      return data;
    }

    const student = mockStudents.find((s) => s.card_id === cardId);
    if (!student || student.status !== 'approved') return null;

    return {
      card_id: student.card_id,
      name: student.name,
      roll_no: student.rollNo || student.roll_no,
      year: student.year,
      photo_url: student.photoUrl || student.photo_url,
      valid_until: student.validUntil || student.valid_until,
      status: student.status,
      college_name: student.collegeName || 'MIT College of Technology',
      department_name: student.department || student.department_name,
    };
  },
};
