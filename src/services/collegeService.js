import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SAMPLE_TEMPLATES } from '../utils/sampleData';

const COLLEGES_STORAGE_KEY = 'cardcraft_colleges_data';

const INITIAL_DEFAULT_COLLEGES = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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
    id: 'col-ait-002',
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
    id: 'col-sec-003',
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

function getStoredColleges() {
  try {
    const raw = localStorage.getItem(COLLEGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to parse stored colleges:', err);
  }
  return INITIAL_DEFAULT_COLLEGES;
}

function saveStoredColleges(colleges) {
  try {
    localStorage.setItem(COLLEGES_STORAGE_KEY, JSON.stringify(colleges));
  } catch (err) {
    console.error('Failed to save colleges to localStorage:', err);
  }
}

export const collegeService = {
  /**
   * Fetch all colleges (Admin only)
   */
  async getColleges() {
    const stored = getStoredColleges();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('colleges')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const normalized = data.map((c) => ({
            ...c,
            studentLimit: c.student_limit || c.studentLimit || 1000,
            validUntil: c.valid_until || c.validUntil || '2027-12-31',
          }));

          // Merge with any locally registered colleges so none are missing
          const remoteCodes = new Set(normalized.map((c) => c.code?.toUpperCase()));
          stored.forEach((localCol) => {
            if (!remoteCodes.has(localCol.code?.toUpperCase())) {
              normalized.push(localCol);
            }
          });

          saveStoredColleges(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('Supabase getColleges failed, returning stored colleges:', err);
      }
    }

    return stored;
  },

  /**
   * Fetch a single college by ID or Code
   */
  async getCollegeById(id) {
    const stored = getStoredColleges();
    const match = stored.find(
      (c) => c.id === id || c.code?.toLowerCase() === String(id).toLowerCase()
    );

    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('colleges').select('*');
        // Check if ID is UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          query = query.eq('id', id);
        } else {
          query = query.eq('code', String(id).toUpperCase());
        }

        const { data, error } = await query.single();
        if (!error && data) {
          return {
            ...data,
            studentLimit: data.student_limit,
            validUntil: data.valid_until,
          };
        }
      } catch (err) {
        console.warn('Supabase getCollegeById failed:', err);
      }
    }

    return match || stored[0] || null;
  },

  /**
   * Create a new college tenant
   */
  async createCollege(collegeData) {
    const cleanCode = (collegeData.code || `COL-${Date.now()}`).trim().toUpperCase();
    const newCollege = {
      ...collegeData,
      id: collegeData.id || `col-${cleanCode.toLowerCase()}-${Date.now()}`,
      name: collegeData.name?.trim() || 'New College',
      code: cleanCode,
      studentLimit: Number(collegeData.studentLimit || collegeData.student_limit || 1000),
      student_limit: Number(collegeData.studentLimit || collegeData.student_limit || 1000),
      validUntil: collegeData.validUntil || collegeData.valid_until || '2027-12-31',
      valid_until: collegeData.validUntil || collegeData.valid_until || '2027-12-31',
      status: collegeData.status || 'active',
      template_config: collegeData.template_config || SAMPLE_TEMPLATES.classicBlue,
      created_at: new Date().toISOString(),
    };

    // 1. Attempt to insert into Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('colleges')
          .insert([
            {
              name: newCollege.name,
              code: newCollege.code,
              student_limit: newCollege.student_limit,
              valid_until: newCollege.valid_until,
              status: newCollege.status,
              template_config: newCollege.template_config,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          newCollege.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase college insert failed, saving to local store:', err);
      }
    }

    // 2. Save to local storage cache so it persists on reload
    const stored = getStoredColleges();
    const updated = [
      newCollege,
      ...stored.filter((c) => c.id !== newCollege.id && c.code !== newCollege.code),
    ];
    saveStoredColleges(updated);

    return newCollege;
  },

  /**
   * Update college metadata
   */
  async updateCollege(id, updates) {
    let updatedCol = null;

    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {};
        if (updates.name) payload.name = updates.name;
        if (updates.code) payload.code = updates.code.toUpperCase();
        if (updates.studentLimit || updates.student_limit) {
          payload.student_limit = Number(updates.studentLimit || updates.student_limit);
        }
        if (updates.validUntil || updates.valid_until) {
          payload.valid_until = updates.validUntil || updates.valid_until;
        }
        if (updates.status) payload.status = updates.status;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let query = supabase.from('colleges').update(payload);
        if (isUuid) {
          query = query.eq('id', id);
        } else {
          query = query.eq('code', String(id).toUpperCase());
        }

        const { data, error } = await query.select().single();
        if (!error && data) {
          updatedCol = {
            ...data,
            studentLimit: data.student_limit,
            validUntil: data.valid_until,
          };
        }
      } catch (err) {
        console.warn('Supabase college update failed:', err);
      }
    }

    // Update in stored list
    const stored = getStoredColleges();
    const idx = stored.findIndex((c) => c.id === id || c.code === updates.code);
    if (idx !== -1) {
      stored[idx] = { ...stored[idx], ...updates };
      updatedCol = stored[idx];
    } else {
      updatedCol = { id, ...updates };
      stored.unshift(updatedCol);
    }
    saveStoredColleges(stored);

    return updatedCol;
  },

  /**
   * Delete college
   */
  async deleteCollege(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          await supabase.from('colleges').delete().eq('id', id);
        } else {
          await supabase.from('colleges').delete().eq('code', String(id).toUpperCase());
        }
      } catch (err) {
        console.warn('Supabase delete failed:', err);
      }
    }

    const stored = getStoredColleges().filter((c) => c.id !== id);
    saveStoredColleges(stored);
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
