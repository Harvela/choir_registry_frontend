import { api } from '@/config/api';

export type Department = {
  id: number;
  name: string;
  code: string;
};

export const DepartmentService = {
  async listDepartments(): Promise<Department[]> {
    const { data } = await api.get<Department[]>('/departments');
    return data;
  },
};
