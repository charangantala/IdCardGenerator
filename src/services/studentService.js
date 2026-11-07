import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SAMPLE_STUDENTS } from '../utils/sampleData';

const LIVE_STUDENTS_STORAGE_KEY = 'cardcraft_live_students';
const realtimeChannel = typeof window !== 'undefined' && window.BroadcastChannel
  ? new BroadcastChannel('cardcraft_realtime')
  : null;

function getStoredLiveStudents() {
  try {
    const raw = localStorage.getItem(LIVE_STUDENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to parse live students:', err);
  }
  // Initialize with rich sample data so faculty review is immediately populated
  saveStoredLiveStudents(SAMPLE_STUDENTS);
  return SAMPLE_STUDENTS;
}

function saveStoredLiveStudents(students) {
  try {
    localStorage.setItem(LIVE_STUDENTS_STORAGE_KEY, JSON.stringify(students));
  } catch (err) {
    console.error('Failed to save live students:', err);
  }
}

export const studentService = {
  /**
   * Fetch all students across all colleges (for Admin overview)
   */
  async getAllStudents() {
    return this.getStudentsByCollege(null);
  },

  /**
   * Broadcast an event to all open tabs / dashboards
   */
  broadcastChange(type, payload) {
    try {
      if (realtimeChannel) {
        realtimeChannel.postMessage({ type, payload, timestamp: Date.now() });
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cardcraft:student_change', { detail: { type, payload } }));
      }
    } catch (e) {
      console.warn('Broadcast failed:', e);
    }
  },

  /**
   * Subscribe to real-time student changes across all dashboards
   */
  subscribeToChanges(onEvent) {
    const listeners = [];

    // 1. Supabase Postgres Realtime Subscription (if configured)
    if (isSupabaseConfigured() && supabase) {
      try {
        const subChannel = supabase
          .channel('students-realtime-sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'students' },
            (payload) => {
              if (onEvent) onEvent(payload.eventType, payload.new || payload.old);
            }
          )
          .subscribe();

        listeners.push(() => {
          supabase.removeChannel(subChannel);
        });
      } catch (err) {
        console.warn('Supabase realtime subscription failed:', err);
      }
    }

    // 2. Browser BroadcastChannel for instant cross-tab sync
    if (realtimeChannel) {
      const handleBroadcast = (evt) => {
        if (evt.data && onEvent) {
          onEvent(evt.data.type, evt.data.payload);
        }
      };
      realtimeChannel.addEventListener('message', handleBroadcast);
      listeners.push(() => {
        realtimeChannel.removeEventListener('message', handleBroadcast);
      });
    }

    // 3. Same-window CustomEvent listener
    if (typeof window !== 'undefined') {
      const handleCustom = (evt) => {
        if (evt.detail && onEvent) {
          onEvent(evt.detail.type, evt.detail.payload);
        }
      };
      window.addEventListener('cardcraft:student_change', handleCustom);
      listeners.push(() => {
        window.removeEventListener('cardcraft:student_change', handleCustom);
      });
    }

    return () => {
      listeners.forEach((cleanup) => cleanup());
    };
  },

  /**
   * Fetch students strictly filtered by college_id from Supabase (or live store)
   */
  async getStudentsByCollege(collegeId = null, filters = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('students')
          .select(`
            *,
            departments ( name, code )
          `)
          .order('created_at', { ascending: false });

        // If collegeId is specified and not 'all', filter by college_id
        if (collegeId && collegeId !== 'all') {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collegeId);
          if (isUuid) {
            query = query.eq('college_id', collegeId);
          } else if (collegeId.toLowerCase() === 'mitc') {
            query = query.or('college_id.eq.a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11,college_id.ilike.mitc');
          }
        }

        if (filters.departmentId) {
          query = query.eq('department_id', filters.departmentId);
        }
        if (filters.year && filters.year !== 'all') {
          query = query.eq('year', Number(filters.year));
        }
        if (filters.section && filters.section !== 'all') {
          query = query.eq('section', filters.section);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.search?.trim()) {
          const s = filters.search.trim();
          query = query.or(`name.ilike.%${s}%,roll_no.ilike.%${s}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          // Normalize fields for UI compatibility
          const normalized = data.map((st) => ({
            ...st,
            rollNo: st.roll_no,
            photoUrl: st.photo_url,
            bloodGroup: st.blood_group,
            department: st.departments?.name || st.department_name || '',
          }));
          return normalized;
        }
      } catch (err) {
        console.warn('Supabase fetch students failed, checking live sync store:', err);
      }
    }

    // Fallback to live store (persists across student submissions & college dashboard)
    const stored = getStoredLiveStudents();
    return stored.filter((s) => {
      if (collegeId && collegeId !== 'all') {
        const target = collegeId.toLowerCase();
        const sCol = (s.college_id || 'mitc').toLowerCase();
        const sCode = (s.collegeCode || '').toLowerCase();
        const isMitc =
          target === 'mitc' &&
          (sCol === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' || sCode === 'mitc' || sCol === 'mitc');
        if (sCol !== target && sCode !== target && !isMitc) return false;
      }
      if (filters.departmentId && s.department_id !== filters.departmentId) return false;
      if (filters.year && filters.year !== 'all' && Number(s.year) !== Number(filters.year)) return false;
      if (filters.section && filters.section !== 'all' && (s.section || 'A').toUpperCase() !== filters.section.toUpperCase()) return false;
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
   * Submit or create a new student application
   */
  async createStudent(collegeId = 'mitc', studentData) {
    const newStudent = {
      ...studentData,
      id: studentData.id || `stud-${Date.now()}`,
      college_id: collegeId,
      collegeName: studentData.collegeName,
      collegeCode: studentData.collegeCode,
      card_id: studentData.card_id || `card-${Date.now()}`,
      name: studentData.name,
      roll_no: studentData.rollNo || studentData.roll_no,
      rollNo: studentData.rollNo || studentData.roll_no,
      department: studentData.department || studentData.department_name || '',
      department_id: studentData.department_id || 'dept-cse',
      year: Number(studentData.year) || 1,
      section: (studentData.section || 'A').toUpperCase(),
      dob: studentData.dob || null,
      gender: studentData.gender || 'Male',
      blood_group: studentData.bloodGroup || studentData.blood_group || 'O+',
      bloodGroup: studentData.bloodGroup || studentData.blood_group || 'O+',
      phone: studentData.phone || '',
      email: studentData.email || '',
      address: studentData.address || '',
      photo_url: studentData.photoUrl || studentData.photo_url || '',
      photoUrl: studentData.photoUrl || studentData.photo_url || '',
      status: studentData.status || 'submitted',
      valid_until: studentData.validUntil || studentData.valid_until || '2027-06-30',
      created_at: new Date().toISOString(),
    };

    // 1. Save to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          college_id: collegeId === 'mitc' ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' : collegeId,
          department_id: studentData.department_id?.startsWith('dept-')
            ? 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'
            : (studentData.department_id || 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'),
          name: newStudent.name,
          roll_no: newStudent.roll_no,
          year: newStudent.year,
          section: newStudent.section,
          dob: newStudent.dob || null,
          gender: newStudent.gender,
          blood_group: newStudent.blood_group,
          phone: newStudent.phone,
          email: newStudent.email,
          address: newStudent.address,
          photo_url: newStudent.photo_url,
          status: newStudent.status,
          valid_until: newStudent.valid_until,
        };

        const { data, error } = await supabase.from('students').insert([payload]).select().single();
        if (!error && data) {
          newStudent.id = data.id;
          newStudent.card_id = data.card_id || newStudent.card_id;
        }
      } catch (err) {
        console.warn('Supabase insert failed, saving to synchronized live store:', err);
      }
    }

    // 2. Save to Live Sync Store & Broadcast
    const stored = getStoredLiveStudents();
    const updated = [newStudent, ...stored.filter((s) => s.id !== newStudent.id && s.roll_no !== newStudent.roll_no)];
    saveStoredLiveStudents(updated);

    this.broadcastChange('STUDENT_SUBMITTED', newStudent);
    return newStudent;
  },

  /**
   * Update student details or approval status
   */
  async updateStudent(collegeId = 'mitc', studentId, updates) {
    let updatedStudent = null;

    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {};
        if (updates.name) payload.name = updates.name;
        if (updates.rollNo || updates.roll_no) payload.roll_no = updates.rollNo || updates.roll_no;
        if (updates.year) payload.year = Number(updates.year);
        if (updates.section) payload.section = updates.section;
        if (updates.status) payload.status = updates.status;
        if (updates.approved_by) payload.approved_by = updates.approved_by;
        if (updates.reject_reason !== undefined) payload.reject_reason = updates.reject_reason;
        if (updates.photoUrl || updates.photo_url) payload.photo_url = updates.photoUrl || updates.photo_url;
        if (updates.bloodGroup || updates.blood_group) payload.blood_group = updates.bloodGroup || updates.blood_group;
        if (updates.phone) payload.phone = updates.phone;
        if (updates.email) payload.email = updates.email;

        const { data, error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', studentId)
          .select()
          .single();

        if (!error && data) {
          updatedStudent = {
            ...data,
            rollNo: data.roll_no,
            photoUrl: data.photo_url,
            bloodGroup: data.blood_group,
          };
        }
      } catch (err) {
        console.warn('Supabase update student failed:', err);
      }
    }

    // Update live sync store
    const stored = getStoredLiveStudents();
    const index = stored.findIndex((s) => s.id === studentId);
    if (index !== -1) {
      stored[index] = { ...stored[index], ...updates };
      updatedStudent = stored[index];
    } else {
      updatedStudent = { id: studentId, college_id: collegeId, ...updates };
      stored.unshift(updatedStudent);
    }
    saveStoredLiveStudents(stored);

    this.broadcastChange('STUDENT_UPDATED', updatedStudent);
    return updatedStudent;
  },

  /**
   * Update student status (Approve / Reject)
   */
  async updateStatus(collegeId, studentId, status, rejectReason = null, approvedBy = null) {
    return this.updateStudent(collegeId, studentId, {
      status,
      reject_reason: status === 'rejected' ? rejectReason : null,
      approved_by: status === 'approved' ? approvedBy : null,
    });
  },

  /**
   * Delete student record
   */
  async deleteStudent(collegeId, studentId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('students').delete().eq('id', studentId);
      } catch (e) {
        console.warn('Supabase delete failed:', e);
      }
    }

    const stored = getStoredLiveStudents().filter((s) => s.id !== studentId);
    saveStoredLiveStudents(stored);
    this.broadcastChange('STUDENT_DELETED', { id: studentId });
    return true;
  },

  /**
   * Public Card Verification
   */
  async verifyCard(cardId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('public_card_verification')
          .select('*')
          .eq('card_id', cardId)
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Public verify query failed:', e);
      }
    }

    const student = getStoredLiveStudents().find((s) => s.card_id === cardId);
    if (!student || student.status !== 'approved') return null;

    return {
      card_id: student.card_id,
      name: student.name,
      roll_no: student.rollNo || student.roll_no,
      year: student.year,
      section: student.section || 'A',
      approved_by: student.approved_by,
      photo_url: student.photoUrl || student.photo_url,
      valid_until: student.validUntil || student.valid_until,
      status: student.status,
      college_name: student.collegeName || 'MIT College of Technology',
      department_name: student.department || student.department_name,
    };
  },
};
