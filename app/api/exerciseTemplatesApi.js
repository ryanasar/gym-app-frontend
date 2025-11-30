import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

const BASE_URL = `${BACKEND_API_URL}/exercise-templates`;

export const getAllExerciseTemplates = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch exercise templates:', error);
    throw error;
  }
};

export const getExerciseTemplateById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch exercise template:', error);
    throw error;
  }
};

export const createExerciseTemplate = async (templateData) => {
  try {
    const response = await axios.post(BASE_URL, templateData);
    return response.data;
  } catch (error) {
    console.error('Failed to create exercise template:', error);
    throw error;
  }
};

export const updateExerciseTemplate = async (id, templateData) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, templateData);
    return response.data;
  } catch (error) {
    console.error('Failed to update exercise template:', error);
    throw error;
  }
};

export const deleteExerciseTemplate = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete exercise template:', error);
    throw error;
  }
};

export const addMuscleToTemplate = async (exerciseTemplateId, muscleId) => {
  try {
    const response = await axios.post(`${BASE_URL}/muscle`, {
      exerciseTemplateId,
      muscleId
    });
    return response.data;
  } catch (error) {
    console.error('Failed to add muscle to template:', error);
    throw error;
  }
};

export const removeMuscleFromTemplate = async (templateId, muscleId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${templateId}/muscle/${muscleId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to remove muscle from template:', error);
    throw error;
  }
};

export default function ExerciseTemplatesApiPage() {
  return null;
}