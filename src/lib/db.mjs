// Dispatcher de almacenamiento:
// - Si existe POSTGRES_URL -> usa Vercel Postgres (producción).
// - Si no -> usa backend local JSON en disco (desarrollo sin Vercel).

const usePostgres = !!process.env.POSTGRES_URL;
const mod = await import(usePostgres ? './db-postgres.mjs' : './db-local.mjs');

export const listCategories = mod.listCategories;
export const listCategoriesWithVotes = mod.listCategoriesWithVotes;
export const getCategory = mod.getCategory;
export const createCategory = mod.createCategory;
export const updateCategory = mod.updateCategory;
export const deleteCategory = mod.deleteCategory;
export const listActors = mod.listActors;
export const getActor = mod.getActor;
export const createActor = mod.createActor;
export const updateActor = mod.updateActor;
export const deleteActor = mod.deleteActor;
export const addVote = mod.addVote;
export const listVotes = mod.listVotes;
export const clearVotes = mod.clearVotes;
export const getSetting = mod.getSetting;
export const setSetting = mod.setSetting;
export const getActiveActor = mod.getActiveActor;
export const getVoteStats = mod.getVoteStats;
export const listVotesForActor = mod.listVotesForActor;
export const replaceVotesForActor = mod.replaceVotesForActor;
