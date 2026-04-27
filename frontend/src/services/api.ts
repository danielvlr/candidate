import {
  CandidateDTO,
  JobDTO,
  JobApplicationDTO,
  PageResponse,
  CandidateFilters,
  JobFilters,
  ClientFilters,
  PaginationParams,
  CandidateStatus,
  JobStatus,
  ApplicationStatus,
  ClientDTO,
  JobHistoryDTO,
  JobHistoryCreateRequest,
  HistoryType,
  ShortlistDTO,
  ShortlistCreateRequest,
  ShortlistStatus,
  AssessoradoDTO,
  AssessoradoCreateRequest,
  AssessoradoHistoryDTO,
  JobMatchDTO,
  HeadhunterDTO,
  WarrantyDTO,
  WarrantyRuleDTO,
  SyncResultDTO,
  SyncLogDTO,
  TimelineEntryDTO,
  ClientHistoryResponse,
  ClientHistoryCreateRequest,
  ClientHistoryUpdateRequest,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private buildQueryParams(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  // Candidate API methods
  async getCandidates(
    pagination: PaginationParams = {},
    filters: CandidateFilters = {}
  ): Promise<PageResponse<CandidateDTO>> {
    const params = { ...pagination, ...filters };
    const queryString = this.buildQueryParams(params);
    const endpoint = filters && Object.keys(filters).length > 0
      ? `/candidates/filter?${queryString}`
      : `/candidates?${queryString}`;

    return this.request<PageResponse<CandidateDTO>>(endpoint);
  }

  async getCandidateById(id: number): Promise<CandidateDTO> {
    return this.request<CandidateDTO>(`/candidates/${id}`);
  }

  async getCandidateStatusHistory(id: number): Promise<{ id: number; status: string; candidateName: string; createdAt: string }[]> {
    return this.request(`/candidates/${id}/status-history`);
  }

  async getCandidateByEmail(email: string): Promise<CandidateDTO> {
    return this.request<CandidateDTO>(`/candidates/email/${encodeURIComponent(email)}`);
  }

  async searchCandidates(
    query: string,
    pagination: PaginationParams = {}
  ): Promise<PageResponse<CandidateDTO>> {
    const params = { q: query, ...pagination };
    const queryString = this.buildQueryParams(params);
    return this.request<PageResponse<CandidateDTO>>(`/candidates/search?${queryString}`);
  }

  async createCandidate(candidate: CandidateDTO): Promise<CandidateDTO> {
    return this.request<CandidateDTO>('/candidates', {
      method: 'POST',
      body: JSON.stringify(candidate),
    });
  }

  async updateCandidate(id: number, candidate: CandidateDTO): Promise<CandidateDTO> {
    return this.request<CandidateDTO>(`/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(candidate),
    });
  }

  async deleteCandidate(id: number): Promise<void> {
    return this.request<void>(`/candidates/${id}`, {
      method: 'DELETE',
    });
  }

  async activateCandidate(id: number): Promise<void> {
    return this.request<void>(`/candidates/${id}/activate`, {
      method: 'PATCH',
    });
  }

  async blacklistCandidate(id: number, reason?: string): Promise<void> {
    return this.request<void>(`/candidates/${id}/blacklist`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async getCandidatesByStatus(status: CandidateStatus): Promise<CandidateDTO[]> {
    return this.request<CandidateDTO[]>(`/candidates/status/${status}`);
  }

  async getCandidateCounts(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/candidates/count');
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    const queryString = this.buildQueryParams({ email });
    return this.request<{ exists: boolean }>(`/candidates/exists?${queryString}`);
  }

  async getCities(): Promise<string[]> {
    return this.request<string[]>('/candidates/cities');
  }

  async getHeadlines(): Promise<string[]> {
    return this.request<string[]>('/candidates/headlines');
  }

  // LinkedIn Integration methods
  async importFromLinkedIn(linkedInUrl: string): Promise<CandidateDTO> {
    return this.request<CandidateDTO>('/candidates/import-linkedin', {
      method: 'POST',
      body: JSON.stringify({ linkedInUrl }),
    });
  }

  async importFromLinkedInPdf(file: File): Promise<CandidateDTO> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/candidates/import-linkedin-pdf`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PDF upload failed:', error);
      throw error;
    }
  }

  async validateLinkedInUrl(linkedInUrl: string): Promise<{ valid: boolean }> {
    return this.request<{ valid: boolean }>('/candidates/validate-linkedin', {
      method: 'POST',
      body: JSON.stringify({ linkedInUrl }),
    });
  }

  // Job API methods
  async getJobs(
    pagination: PaginationParams = {},
    filters: JobFilters = {}
  ): Promise<PageResponse<JobDTO>> {
    const params = { ...pagination, ...filters };
    const queryString = this.buildQueryParams(params);
    const endpoint = filters && Object.keys(filters).length > 0
      ? `/jobs/filter?${queryString}`
      : `/jobs?${queryString}`;

    return this.request<PageResponse<JobDTO>>(endpoint);
  }

  async getJobById(id: number): Promise<JobDTO> {
    return this.request<JobDTO>(`/jobs/${id}`);
  }

  async searchJobs(
    query: string,
    pagination: PaginationParams = {}
  ): Promise<PageResponse<JobDTO>> {
    const params = { q: query, ...pagination };
    const queryString = this.buildQueryParams(params);
    return this.request<PageResponse<JobDTO>>(`/jobs/search?${queryString}`);
  }

  async createJob(job: JobDTO): Promise<JobDTO> {
    return this.request<JobDTO>('/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    });
  }

  async updateJob(id: number, job: JobDTO): Promise<JobDTO> {
    return this.request<JobDTO>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(job),
    });
  }

  async deleteJob(id: number): Promise<void> {
    return this.request<void>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async pauseJob(id: number): Promise<void> {
    return this.request<void>(`/jobs/${id}/pause`, {
      method: 'PATCH',
    });
  }

  async activateJob(id: number): Promise<void> {
    return this.request<void>(`/jobs/${id}/activate`, {
      method: 'PATCH',
    });
  }

  async closeJob(id: number): Promise<void> {
    return this.request<void>(`/jobs/${id}/close`, {
      method: 'PATCH',
    });
  }

  async toggleJobFeatured(id: number, featured: boolean): Promise<void> {
    return this.request<void>(`/jobs/${id}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ featured }),
    });
  }

  async toggleJobUrgent(id: number, urgent: boolean): Promise<void> {
    return this.request<void>(`/jobs/${id}/urgent`, {
      method: 'PATCH',
      body: JSON.stringify({ urgent }),
    });
  }

  async getJobsByStatus(status: JobStatus): Promise<JobDTO[]> {
    return this.request<JobDTO[]>(`/jobs/status/${status}`);
  }

  async getFeaturedJobs(): Promise<JobDTO[]> {
    return this.request<JobDTO[]>('/jobs/featured');
  }

  async getUrgentJobs(): Promise<JobDTO[]> {
    return this.request<JobDTO[]>('/jobs/urgent');
  }

  async getJobCounts(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/jobs/count');
  }

  async expireOldJobs(): Promise<void> {
    return this.request<void>('/jobs/expire-jobs', {
      method: 'POST',
    });
  }

  async getJobLocations(): Promise<string[]> {
    return this.request<string[]>('/jobs/locations');
  }

  async getJobCompanies(): Promise<string[]> {
    return this.request<string[]>('/jobs/companies');
  }

  // Job Application API methods (if you have a controller for this)
  async getJobApplications(
    pagination: PaginationParams = {}
  ): Promise<PageResponse<JobApplicationDTO>> {
    const queryString = this.buildQueryParams(pagination);
    return this.request<PageResponse<JobApplicationDTO>>(`/applications?${queryString}`);
  }

  async getJobApplicationById(id: number): Promise<JobApplicationDTO> {
    return this.request<JobApplicationDTO>(`/applications/${id}`);
  }

  async getApplicationsByJob(jobId: number, pagination: PaginationParams = {}): Promise<PageResponse<JobApplicationDTO>> {
    const queryString = this.buildQueryParams(pagination);
    return this.request<PageResponse<JobApplicationDTO>>(`/applications/job/${jobId}?${queryString}`);
  }

  async createJobApplication(application: JobApplicationDTO): Promise<JobApplicationDTO> {
    return this.request<JobApplicationDTO>('/applications', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  async linkCandidateToJob(candidateId: number, jobId: number): Promise<any> {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify({ candidateId, jobId }),
    });
  }

  async updateJobApplicationStatus(id: number, status: ApplicationStatus): Promise<void> {
    return this.request<void>(`/job-applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // =====================
  // Client API methods
  // =====================
  async getClients(
    pagination: PaginationParams = {},
    filters: ClientFilters = {}
  ): Promise<PageResponse<ClientDTO>> {
    const params = { ...pagination, ...filters };
    const queryString = this.buildQueryParams(params);
    const endpoint = filters && Object.keys(filters).length > 0
      ? `/clients/filter?${queryString}`
      : `/clients?${queryString}`;
    return this.request<PageResponse<ClientDTO>>(endpoint);
  }

  async getClientById(id: number): Promise<ClientDTO> {
    return this.request<ClientDTO>(`/clients/${id}`);
  }

  async getClientByCnpj(cnpj: string): Promise<ClientDTO> {
    return this.request<ClientDTO>(`/clients/cnpj/${encodeURIComponent(cnpj)}`);
  }

  async searchClients(
    query: string,
    pagination: PaginationParams = {}
  ): Promise<PageResponse<ClientDTO>> {
    const params = { q: query, ...pagination };
    const queryString = this.buildQueryParams(params);
    return this.request<PageResponse<ClientDTO>>(`/clients/search?${queryString}`);
  }

  async getActiveClients(): Promise<ClientDTO[]> {
    return this.request<ClientDTO[]>('/clients/status/ACTIVE');
  }

  async createClient(client: ClientDTO): Promise<ClientDTO> {
    return this.request<ClientDTO>('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async updateClient(id: number, client: ClientDTO): Promise<ClientDTO> {
    return this.request<ClientDTO>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  async deleteClient(id: number): Promise<void> {
    return this.request<void>(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async activateClient(id: number): Promise<void> {
    return this.request<void>(`/clients/${id}/activate`, {
      method: 'PATCH',
    });
  }

  async suspendClient(id: number): Promise<void> {
    return this.request<void>(`/clients/${id}/suspend`, {
      method: 'PATCH',
    });
  }

  async getClientCities(): Promise<string[]> {
    return this.request<string[]>('/clients/cities');
  }

  async getClientIndustries(): Promise<string[]> {
    return this.request<string[]>('/clients/industries');
  }

  // =====================
  // Job History API methods
  // =====================
  async getJobHistory(jobId: number): Promise<JobHistoryDTO[]> {
    return this.request<JobHistoryDTO[]>(`/job-history/job/${jobId}`);
  }

  async getJobHistoryPaginated(
    jobId: number,
    pagination: PaginationParams = {}
  ): Promise<PageResponse<JobHistoryDTO>> {
    const queryString = this.buildQueryParams(pagination);
    return this.request<PageResponse<JobHistoryDTO>>(`/job-history/job/${jobId}/paginated?${queryString}`);
  }

  async getJobHistoryByType(jobId: number, type: HistoryType): Promise<JobHistoryDTO[]> {
    return this.request<JobHistoryDTO[]>(`/job-history/job/${jobId}/type/${type}`);
  }

  async getJobHistoryByCandidate(jobId: number, candidateId: number): Promise<JobHistoryDTO[]> {
    return this.request<JobHistoryDTO[]>(`/job-history/job/${jobId}/candidate/${candidateId}`);
  }

  async createJobHistory(request: JobHistoryCreateRequest): Promise<JobHistoryDTO> {
    return this.request<JobHistoryDTO>('/job-history', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateJobHistory(id: number, request: JobHistoryCreateRequest): Promise<JobHistoryDTO> {
    return this.request<JobHistoryDTO>(`/job-history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteJobHistory(id: number): Promise<void> {
    return this.request<void>(`/job-history/${id}`, {
      method: 'DELETE',
    });
  }

  async completeJobHistory(id: number): Promise<void> {
    return this.request<void>(`/job-history/${id}/complete`, {
      method: 'PATCH',
    });
  }

  async getJobHistoryCounts(jobId: number): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(`/job-history/job/${jobId}/count`);
  }

  async getPendingJobTasks(): Promise<JobHistoryDTO[]> {
    return this.request<JobHistoryDTO[]>('/job-history/pending');
  }

  // =====================
  // Shortlist API methods
  // =====================
  async getShortlistsByJob(jobId: number): Promise<ShortlistDTO[]> {
    return this.request<ShortlistDTO[]>(`/shortlists/job/${jobId}`);
  }

  async getShortlistsByJobAndStatus(jobId: number, status: ShortlistStatus): Promise<ShortlistDTO[]> {
    return this.request<ShortlistDTO[]>(`/shortlists/job/${jobId}/status/${status}`);
  }

  async createShortlist(request: ShortlistCreateRequest): Promise<ShortlistDTO[]> {
    return this.request<ShortlistDTO[]>('/shortlists', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateShortlistStatus(id: number, status: ShortlistStatus, feedback?: string): Promise<void> {
    const queryString = this.buildQueryParams({ status, feedback });
    return this.request<void>(`/shortlists/${id}/status?${queryString}`, {
      method: 'PATCH',
    });
  }

  async deleteShortlist(id: number): Promise<void> {
    return this.request<void>(`/shortlists/${id}`, {
      method: 'DELETE',
    });
  }

  async getShortlistCounts(jobId: number): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(`/shortlists/job/${jobId}/count`);
  }

  // =====================
  // Headhunter API methods
  // =====================
  async getHeadhunters(
    pagination: PaginationParams = {}
  ): Promise<PageResponse<HeadhunterDTO>> {
    const queryString = this.buildQueryParams(pagination);
    return this.request<PageResponse<HeadhunterDTO>>(`/headhunters?${queryString}`);
  }

  async getHeadhunterById(id: number): Promise<HeadhunterDTO> {
    return this.request<HeadhunterDTO>(`/headhunters/${id}`);
  }

  async searchHeadhunters(
    query: string,
    pagination: PaginationParams = {}
  ): Promise<PageResponse<HeadhunterDTO>> {
    const params = { name: query, ...pagination };
    const queryString = this.buildQueryParams(params);
    return this.request<PageResponse<HeadhunterDTO>>(`/headhunters/filter?${queryString}`);
  }

  // =====================
  // Assessorado API methods
  // =====================
  async getAssessorados(
    pagination: PaginationParams = {}
  ): Promise<PageResponse<AssessoradoDTO>> {
    const queryString = this.buildQueryParams(pagination);
    return this.request<PageResponse<AssessoradoDTO>>(`/assessorados?${queryString}`);
  }

  async getAssessoradoById(id: number): Promise<AssessoradoDTO> {
    return this.request<AssessoradoDTO>(`/assessorados/${id}`);
  }

  async getAssessoradosBySenior(
    seniorId: number,
    pagination: PaginationParams = {}
  ): Promise<PageResponse<AssessoradoDTO>> {
    const queryString = this.buildQueryParams(pagination);
    return this.request<PageResponse<AssessoradoDTO>>(`/assessorados/senior/${seniorId}?${queryString}`);
  }

  async createAssessorado(request: AssessoradoCreateRequest): Promise<AssessoradoDTO> {
    return this.request<AssessoradoDTO>('/assessorados', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateAssessorado(id: number, request: AssessoradoCreateRequest): Promise<AssessoradoDTO> {
    return this.request<AssessoradoDTO>(`/assessorados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteAssessorado(id: number): Promise<void> {
    return this.request<void>(`/assessorados/${id}`, {
      method: 'DELETE',
    });
  }

  async changeAssessoradoPhase(id: number, phase: string): Promise<void> {
    return this.request<void>(`/assessorados/${id}/phase`, {
      method: 'PATCH',
      body: JSON.stringify({ phase }),
    });
  }

  async getAssessoradoHistory(assessoradoId: number): Promise<AssessoradoHistoryDTO[]> {
    return this.request<AssessoradoHistoryDTO[]>(`/assessorados/${assessoradoId}/history`);
  }

  async getMatchingJobs(assessoradoId: number): Promise<JobMatchDTO[]> {
    return this.request<JobMatchDTO[]>(`/assessorados/${assessoradoId}/matching-jobs`);
  }

  // =====================
  // Kanban API methods
  // =====================
  async getAllJobsKanban(
    params?: { createdAfter?: string; deadlineBefore?: string; warrantyExpiringIn?: number }
  ): Promise<Record<string, JobDTO[]>> {
    const query = params ? this.buildQueryParams(params) : '';
    const endpoint = `/jobs/kanban${query ? '?' + query : ''}`;
    return this.request<Record<string, JobDTO[]>>(endpoint);
  }

  async getAllJobsKanbanPipeline(
    params?: { createdAfter?: string; deadlineBefore?: string; warrantyExpiringIn?: number }
  ): Promise<Record<string, JobDTO[]>> {
    const query = params ? this.buildQueryParams(params) : '';
    const endpoint = `/jobs/kanban/pipeline${query ? '?' + query : ''}`;
    return this.request<Record<string, JobDTO[]>>(endpoint);
  }

  async getJobsKanban(
    headhunterId: number,
    params?: { createdAfter?: string; deadlineBefore?: string; warrantyExpiringIn?: number }
  ): Promise<Record<string, JobDTO[]>> {
    const query = params ? this.buildQueryParams(params) : '';
    const endpoint = `/jobs/kanban/headhunter/${headhunterId}${query ? '?' + query : ''}`;
    return this.request<Record<string, JobDTO[]>>(endpoint);
  }

  async getJobsKanbanPipeline(
    headhunterId: number,
    params?: { createdAfter?: string; deadlineBefore?: string; warrantyExpiringIn?: number }
  ): Promise<Record<string, JobDTO[]>> {
    const query = params ? this.buildQueryParams(params) : '';
    const endpoint = `/jobs/kanban/headhunter/${headhunterId}/pipeline${query ? '?' + query : ''}`;
    return this.request<Record<string, JobDTO[]>>(endpoint);
  }

  async updateJobPipelineStage(jobId: number, pipelineStage: string): Promise<JobDTO> {
    return this.request<JobDTO>(`/jobs/${jobId}/pipeline-stage`, {
      method: 'PATCH',
      body: JSON.stringify({ pipelineStage }),
    });
  }

  async updateJobStatus(jobId: number, status: string): Promise<JobDTO> {
    return this.request<JobDTO>(`/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // =====================
  // Warranty API methods
  // =====================
  async getWarranties(status?: string): Promise<WarrantyDTO[]> {
    const queryString = status ? this.buildQueryParams({ status }) : '';
    return this.request<WarrantyDTO[]>(`/warranties${queryString ? '?' + queryString : ''}`);
  }

  async getWarrantyById(id: number): Promise<WarrantyDTO> {
    return this.request<WarrantyDTO>(`/warranties/${id}`);
  }

  async getWarrantiesByJob(jobId: number): Promise<WarrantyDTO[]> {
    return this.request<WarrantyDTO[]>(`/warranties/job/${jobId}`);
  }

  async getWarrantiesByHeadhunter(headhunterId: number): Promise<WarrantyDTO[]> {
    return this.request<WarrantyDTO[]>(`/warranties/headhunter/${headhunterId}`);
  }

  async getExpiringWarranties(days?: number): Promise<WarrantyDTO[]> {
    const queryString = days !== undefined ? this.buildQueryParams({ days }) : '';
    return this.request<WarrantyDTO[]>(`/warranties/expiring${queryString ? '?' + queryString : ''}`);
  }

  async breachWarranty(id: number, reason: string): Promise<WarrantyDTO> {
    return this.request<WarrantyDTO>(`/warranties/${id}/breach`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getWarrantyCounts(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/warranties/count');
  }

  async getWarrantyRules(): Promise<WarrantyRuleDTO[]> {
    return this.request<WarrantyRuleDTO[]>('/warranty-rules');
  }

  async createWarrantyRule(serviceCategory: string, defaultDays: number): Promise<WarrantyRuleDTO> {
    return this.request<WarrantyRuleDTO>('/warranty-rules', {
      method: 'POST',
      body: JSON.stringify({ serviceCategory, defaultDays }),
    });
  }

  async updateWarrantyRule(
    id: number,
    data: { defaultDays?: number; active?: boolean }
  ): Promise<WarrantyRuleDTO> {
    return this.request<WarrantyRuleDTO>(`/warranty-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWarrantyRule(id: number): Promise<void> {
    return this.request<void>(`/warranty-rules/${id}`, {
      method: 'DELETE',
    });
  }

  // =====================
  // Jestor Sync API methods
  // =====================
  async triggerJestorSync(): Promise<SyncResultDTO[]> {
    return this.request<SyncResultDTO[]>('/jestor/sync', {
      method: 'POST',
    });
  }

  async getJestorSyncStatus(): Promise<SyncLogDTO> {
    return this.request<SyncLogDTO>('/jestor/sync/status');
  }

  async getJestorSyncHistory(page = 0, size = 20): Promise<{ content: SyncLogDTO[] }> {
    const queryString = this.buildQueryParams({ page, size });
    return this.request<{ content: SyncLogDTO[] }>(`/jestor/sync/history?${queryString}`);
  }

  async testJestorConnection(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/jestor/test-connection', {
      method: 'POST',
    });
  }

  // =====================
  // Client History / Timeline API methods
  // =====================
  async getClientTimeline(
    clientId: number,
    opts?: { page?: number; size?: number; jobId?: number; empresaOnly?: boolean }
  ): Promise<PageResponse<TimelineEntryDTO>> {
    const params: Record<string, any> = {
      page: opts?.page ?? 0,
      size: opts?.size ?? 20,
    };
    if (opts?.jobId !== undefined) params.jobId = opts.jobId;
    if (opts?.empresaOnly !== undefined) params.empresaOnly = opts.empresaOnly;
    const queryString = this.buildQueryParams(params);
    return this.request<PageResponse<TimelineEntryDTO>>(`/clients/${clientId}/timeline?${queryString}`);
  }

  async createClientHistory(req: ClientHistoryCreateRequest): Promise<ClientHistoryResponse> {
    return this.request<ClientHistoryResponse>('/client-history', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async updateClientHistory(id: number, req: ClientHistoryUpdateRequest): Promise<ClientHistoryResponse> {
    return this.request<ClientHistoryResponse>(`/client-history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  }

  async deleteClientHistory(id: number): Promise<void> {
    return this.request<void>(`/client-history/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;