import client from './client';

export const getDashboardData = () => client.get('/dashboard/');
export const getAuditLogs = () => client.get('/dashboard/audit-logs');
