import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SAMPLE_TEMPLATES } from '../utils/sampleData';

const STORAGE_KEY = 'cardcraft_college_templates';

const DEFAULT_TEMPLATES = {
  mitc: {
    ...SAMPLE_TEMPLATES.classicBlue,
    collegeName: 'MIT College of Technology',
    collegeCode: 'MITC',
    collegeLogo: 'https://api.iconify.design/lucide:graduation-cap.svg?color=%23ffffff',
    logoSize: 42,
  },
  ait: {
    ...SAMPLE_TEMPLATES.modernEmerald,
    collegeName: 'Apex Institute of Technology',
    collegeCode: 'AIT',
    collegeLogo: 'https://api.iconify.design/lucide:shield-check.svg?color=%23ffffff',
    logoSize: 44,
  },
  sec: {
    ...SAMPLE_TEMPLATES.crimsonTech,
    collegeName: 'Stanford Engineering College',
    collegeCode: 'SEC',
    collegeLogo: 'https://api.iconify.design/lucide:cpu.svg?color=%23ffffff',
    logoSize: 40,
  },
};

/**
 * Loads persisted templates from localStorage or fallback defaults
 */
function getPersistedTemplates() {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_TEMPLATES, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load templates from localStorage:', e);
  }
  return DEFAULT_TEMPLATES;
}

/**
 * Saves templates map to localStorage
 */
function savePersistedTemplates(templatesMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templatesMap));
  } catch (e) {
    console.error('Failed to save templates to localStorage:', e);
  }
}

export const templateService = {
  /**
   * Fetch template config for a specific college
   */
  async getTemplateByCollegeId(collegeId) {
    const safeId = (collegeId || 'mitc').toLowerCase();

    // 1. If Supabase is connected, try database first
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('colleges')
          .select('template_config, name, code, logo_url')
          .or(`id.eq.${collegeId},code.ilike.${collegeId}`)
          .single();

        if (!error && data?.template_config) {
          return {
            ...data.template_config,
            collegeName: data.name,
            collegeCode: data.code,
            collegeLogo: data.logo_url || data.template_config.collegeLogo,
          };
        }
      } catch (err) {
        console.warn('Supabase template query error, falling back to local storage:', err);
      }
    }

    // 2. Read from local storage
    const allTemplates = getPersistedTemplates();
    return allTemplates[safeId] || DEFAULT_TEMPLATES.mitc;
  },

  /**
   * Update and assign template configuration to a specific college (Admin only)
   */
  async updateTemplate(collegeId, templateConfig) {
    const safeId = (collegeId || 'mitc').toLowerCase();

    // Save to local storage cache immediately
    const allTemplates = getPersistedTemplates();
    const updated = {
      ...allTemplates,
      [safeId]: {
        ...templateConfig,
        updatedAt: new Date().toISOString(),
      },
    };
    savePersistedTemplates(updated);

    // If Supabase is connected, update college record in database
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('colleges')
          .update({
            template_config: templateConfig,
            logo_url: templateConfig.collegeLogo || null,
          })
          .or(`id.eq.${collegeId},code.ilike.${collegeId}`)
          .select()
          .single();

        if (error) console.warn('Supabase template update warning:', error);
      } catch (err) {
        console.warn('Supabase template update error:', err);
      }
    }

    return updated[safeId];
  },

  /**
   * List all colleges and their assigned templates
   */
  getAllAssignedTemplates() {
    return getPersistedTemplates();
  },
};
