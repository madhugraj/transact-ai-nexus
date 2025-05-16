
// Re-export all Supabase service functions
export {
  uploadFileToStorage,
  getFileUrl,
  checkFileProcessed,
  ensureStorageBucketExists
} from './supabase/fileService';

export {
  saveExtractedTable,
  getExtractedTables,
  getTableById,
  deleteExtractedTable
} from './supabase/tableService';

export {
  syncLocalStorageWithSupabase
} from './supabase/syncService';
