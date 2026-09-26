import fs from 'fs';
import path from 'path';
import {
  OrganizationSettings,
  Client,
  DocumentTemplate,
  DocumentRecord,
  ActivityLog,
  DocumentType,
} from './types';
import {
  initialOrganization,
  initialClients,
  initialTemplates,
  initialDocuments,
  initialActivityLogs,
} from '@/data/initial-data';

interface AppStore {
  organization: OrganizationSettings;
  clients: Client[];
  templates: DocumentTemplate[];
  documents: DocumentRecord[];
  activityLogs: ActivityLog[];
}

declare global {
  var __v2_store: AppStore | undefined;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const TMP_STORE_FILE = path.join('/tmp', 'v2-store.json');

function ensureStore(): AppStore {
  if (globalThis.__v2_store) {
    return globalThis.__v2_store;
  }

  // 1. Try reading from primary store file
  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as AppStore;
      globalThis.__v2_store = parsed;
      return parsed;
    } catch (e) {
      console.warn('Could not parse STORE_FILE, trying fallback:', e);
    }
  }

  // 2. Try reading from /tmp store file (for Vercel serverless containers)
  try {
    if (fs.existsSync(TMP_STORE_FILE)) {
      const raw = fs.readFileSync(TMP_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as AppStore;
      globalThis.__v2_store = parsed;
      return parsed;
    }
  } catch (e) {
    // Ignore tmp read errors
  }

  // 3. Fallback to initial seed data
  const initialStore: AppStore = {
    organization: initialOrganization,
    clients: initialClients,
    templates: initialTemplates,
    documents: initialDocuments,
    activityLogs: initialActivityLogs,
  };
  globalThis.__v2_store = initialStore;

  // Attempt safe persistence (do not throw if read-only filesystem)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialStore, null, 2), 'utf-8');
  } catch (err) {
    // Primary path is read-only (e.g. Vercel /var/task), try /tmp
    try {
      fs.writeFileSync(TMP_STORE_FILE, JSON.stringify(initialStore, null, 2), 'utf-8');
    } catch {
      // Ephemeral in-memory is active
    }
  }

  return initialStore;
}

function saveStore(store: AppStore): void {
  globalThis.__v2_store = store;

  // Try writing to primary data store
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    return;
  } catch (err) {
    // On Vercel /var/task is read-only (EROFS), write to /tmp instead
    try {
      fs.writeFileSync(TMP_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (tmpErr) {
      console.warn('Could not persist store to disk, relying on in-memory store:', tmpErr);
    }
  }
}

// ----------------- Organization -----------------
export function getOrganization(): OrganizationSettings {
  const store = ensureStore();
  return store.organization;
}

export function updateOrganization(settings: Partial<OrganizationSettings>): OrganizationSettings {
  const store = ensureStore();
  store.organization = { ...store.organization, ...settings };
  saveStore(store);
  addActivityLog({
    action: 'UPDATED_SETTINGS',
    description: 'Updated organization settings and profile',
    user: 'System Admin',
  });
  return store.organization;
}

// ----------------- Clients -----------------
export function getClients(): Client[] {
  const store = ensureStore();
  return store.clients;
}

export function getClient(id: string): Client | undefined {
  const store = ensureStore();
  return store.clients.find((c) => c.id === id);
}

export function saveClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Client {
  const store = ensureStore();
  const now = new Date().toISOString();

  if (clientData.id) {
    const index = store.clients.findIndex((c) => c.id === clientData.id);
    if (index !== -1) {
      const updated: Client = {
        ...store.clients[index],
        ...clientData,
        id: clientData.id,
        updatedAt: now,
      };
      store.clients[index] = updated;
      saveStore(store);
      addActivityLog({
        action: 'CLIENT_UPDATED',
        description: `Updated client details: ${updated.name}`,
        user: 'User',
      });
      return updated;
    }
  }

  const newClient: Client = {
    ...clientData,
    id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: now,
    updatedAt: now,
  };
  store.clients.unshift(newClient);
  saveStore(store);
  addActivityLog({
    action: 'CLIENT_CREATED',
    description: `Added new client: ${newClient.name}`,
    user: 'User',
  });
  return newClient;
}

export function deleteClient(id: string): boolean {
  const store = ensureStore();
  const initialLen = store.clients.length;
  store.clients = store.clients.filter((c) => c.id !== id);
  if (store.clients.length !== initialLen) {
    saveStore(store);
    addActivityLog({
      action: 'CLIENT_DELETED',
      description: `Deleted client ${id}`,
      user: 'User',
    });
    return true;
  }
  return false;
}

// ----------------- Templates -----------------
export function getTemplates(): DocumentTemplate[] {
  const store = ensureStore();
  return store.templates;
}

export function getTemplate(id: string): DocumentTemplate | undefined {
  const store = ensureStore();
  const found = store.templates.find((t) => t.id === id);
  if (found) return found;
  return initialTemplates.find((t) => t.id === id);
}

export function saveTemplate(template: DocumentTemplate): DocumentTemplate {
  const store = ensureStore();
  const index = store.templates.findIndex((t) => t.id === template.id);
  if (index !== -1) {
    store.templates[index] = template;
  } else {
    store.templates.push(template);
  }
  saveStore(store);
  addActivityLog({
    action: 'TEMPLATE_UPDATED',
    description: `Updated layout coordinates for template: ${template.name}`,
    user: 'Template Designer',
  });
  return template;
}

// ----------------- Sequential Document Numbers -----------------
export function getNextDocumentNumber(type: DocumentType): string {
  const store = ensureStore();
  const currentYear = new Date().getFullYear();
  const prefix = type === 'invoice' ? `V2LG-INV-${currentYear}-` : `V2LG-BILL-${currentYear}-`;

  const matching = store.documents.filter((d) => d.documentNumber.startsWith(prefix));
  let maxSeq = 0;

  for (const doc of matching) {
    const parts = doc.documentNumber.split('-');
    const seqStr = parts[parts.length - 1];
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  const nextSeq = maxSeq + 1;
  const padded = nextSeq.toString().padStart(3, '0');
  return `${prefix}${padded}`;
}

// ----------------- Documents -----------------
export function getDocuments(): DocumentRecord[] {
  const store = ensureStore();
  return store.documents;
}

export function getDocument(id: string): DocumentRecord | undefined {
  const store = ensureStore();
  const found = store.documents.find((d) => d.id === id);
  if (found) return found;
  return initialDocuments.find((d) => d.id === id);
}

export function saveDocument(docData: Omit<DocumentRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): DocumentRecord {
  const store = ensureStore();
  const now = new Date().toISOString();

  if (docData.id) {
    const index = store.documents.findIndex((d) => d.id === docData.id);
    if (index !== -1) {
      const updated: DocumentRecord = {
        ...store.documents[index],
        ...docData,
        id: docData.id,
        updatedAt: now,
      };
      store.documents[index] = updated;
      saveStore(store);
      addActivityLog({
        documentId: updated.id,
        action: 'DOCUMENT_UPDATED',
        description: `Updated ${updated.documentType.toUpperCase()} ${updated.documentNumber}`,
        user: updated.preparedBy?.name || 'User',
      });
      return updated;
    }
  }

  const newDoc: DocumentRecord = {
    ...docData,
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: now,
    updatedAt: now,
  };
  store.documents.unshift(newDoc);
  saveStore(store);
  addActivityLog({
    documentId: newDoc.id,
    action: 'DOCUMENT_CREATED',
    description: `Created ${newDoc.documentType.toUpperCase()} ${newDoc.documentNumber} for ${newDoc.clientData.name} (₹${newDoc.payment.totalAmount.toLocaleString('en-IN')})`,
    user: newDoc.preparedBy?.name || 'User',
  });
  return newDoc;
}

export function duplicateDocument(id: string): DocumentRecord | null {
  const doc = getDocument(id);
  if (!doc) return null;

  const nextNum = getNextDocumentNumber(doc.documentType);
  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  const duplicated: DocumentRecord = {
    ...doc,
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    documentNumber: nextNum,
    documentDate: todayStr,
    dueDate: '',
    payment: {
      ...doc.payment,
      amountPaid: 0,
      balanceAmount: doc.payment.totalAmount,
      status: 'PENDING',
    },
    createdAt: now,
    updatedAt: now,
  };

  const store = ensureStore();
  store.documents.unshift(duplicated);
  saveStore(store);

  addActivityLog({
    documentId: duplicated.id,
    action: 'DOCUMENT_DUPLICATED',
    description: `Duplicated ${doc.documentNumber} to new document ${duplicated.documentNumber}`,
    user: 'User',
  });

  return duplicated;
}

export function deleteDocument(id: string): boolean {
  const store = ensureStore();
  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return false;

  store.documents = store.documents.filter((d) => d.id !== id);
  saveStore(store);

  addActivityLog({
    action: 'DOCUMENT_DELETED',
    description: `Deleted ${doc.documentType.toUpperCase()} ${doc.documentNumber}`,
    user: 'User',
  });

  return true;
}

// ----------------- Activity Logs -----------------
export function getActivityLogs(): ActivityLog[] {
  const store = ensureStore();
  return store.activityLogs;
}

export function addActivityLog(logData: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
  const store = ensureStore();
  const newLog: ActivityLog = {
    ...logData,
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
  };
  store.activityLogs.unshift(newLog);
  if (store.activityLogs.length > 200) {
    store.activityLogs = store.activityLogs.slice(0, 200);
  }
  saveStore(store);
  return newLog;
}
