import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SAMPLE_TEMPLATES } from '../utils/sampleData';

const mockCollegeTemplates = {
  mitc: SAMPLE_TEMPLATES.classicBlue,
  ait: SAMPLE_TEMPLATES.modernEmerald,
  sec: SAMPLE_TEMPLATES.crimsonTech,
};

export const templateService = {
  /**
   * Fetch template config for a college
   */
  async getTemplateByCollegeId(collegeId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('colleges')
        .select('template_config, name, code')
        .eq('id', collegeId)
        .single();
      if (error) throw error;
      return {
        ...data.template_config,
        collegeName: data.name,
        collegeCode: data.code,
      };
    }
    return mockCollegeTemplates[collegeId] || SAMPLE_TEMPLATES.classicBlue;
  },

  /**
   * Update template config (Admin only - protected by RLS on Supabase)
   */
  async updateTemplate(collegeId, templateConfig) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('colleges')
        .update({
          template_config: templateConfig,
        })
        .eq('id', collegeId)
        .select()
        .single();
      if (error) throw error;
      return data.template_config;
    }

    mockCollegeTemplates[collegeId] = templateConfig;
    return templateConfig;
  },
};
