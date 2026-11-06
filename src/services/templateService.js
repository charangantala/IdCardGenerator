import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SAMPLE_TEMPLATES } from '../utils/sampleData';

const STORAGE_KEY = 'cardcraft_college_templates';

// Default templates mapping
const DEFAULT_COLLEGE_TEMPLATES = {
  mitc: {
    ...SAMPLE_TEMPLATES.classicBlue,
    collegeName: 'MIT College of Technology',
    collegeCode: 'MITC',
  },
  ait: {
    ...SAMPLE_TEMPLATES.modernEmerald,
    collegeName: 'Apex Institute of Technology',
    collegeCode: 'AIT',
  },
  sec: {
    ...SAMPLE_TEMPLATES.crimsonTech,
    collegeName: 'Stanford Engineering College',
    collegeCode: 'SEC',
  },
};

/**
 * Loads templates from localStorage with fallback to defaults
 */
function getLocalTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_COLLEGE_TEMPLATES, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load templates from localStorage:', e);
  }
  return { ...DEFAULT_COLLEGE_TEMPLATES };
}

/**
 * Saves templates to localStorage
 */
function saveLocalTemplates(templates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates to localStorage:', e);
  }
}

export const templateService = {
  /**
   * Fetch template config for a college
   */
  async getTemplateByCollegeId(collegeId) {
    const key = (collegeId || 'mitc').toLowerCase();
    const localTemplates = getLocalTemplates();

    if (isSupabaseConfigured() && supabase) {
      try {
        // Query by id if uuid, or code if text code
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collegeId);
        let query = supabase.from('colleges').select('template_config, name, code, logo_url');

        if (isUuid) {
          query = query.eq('id', collegeId);
        } else {
          query = query.ilike('code', collegeId);
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data && data.template_config) {
          return {
            ...localTemplates[key],
            ...data.template_config,
            collegeName: data.name,
            collegeCode: data.code,
            collegeLogo: data.template_config.collegeLogo || data.logo_url,
          };
        }
      } catch (err) {
        console.warn('Supabase template fetch warning, using local:', err);
      }
    }

    return localTemplates[key] || localTemplates.mitc || SAMPLE_TEMPLATES.classicBlue;
  },

  /**
   * Update template config (Admin only)
   */
  async updateTemplate(collegeId, templateConfig) {
    const key = (collegeId || 'mitc').toLowerCase();

    // 1. Always persist to localStorage for instant local availability
    const localTemplates = getLocalTemplates();
    localTemplates[key] = {
      ...localTemplates[key],
      ...templateConfig,
    };
    saveLocalTemplates(localTemplates);

    // 2. If Supabase is connected, attempt saving to PostgreSQL
    if (isSupabaseConfigured() && supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collegeId);
        let query = supabase.from('colleges').update({
          template_config: templateConfig,
          logo_url: templateConfig.collegeLogo || null,
        });

        if (isUuid) {
          query = query.eq('id', collegeId);
        } else {
          query = query.ilike('code', collegeId);
        }

        const { data, error } = await query.select().maybeSingle();
        if (error) {
          console.warn('Supabase template update warning (RLS or unauthenticated):', error.message);
        }
      } catch (err) {
        console.warn('Supabase template update error:', err);
      }
    }

    return localTemplates[key];
  },
};
