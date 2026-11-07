const DATABASE_NAME = "study-shelf-books";
const STORE_NAME = "private-books";
export const MAX_PRIVATE_BOOK_BYTES = 20 * 1024 * 1024;

function openBookshelf() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support private book storage."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open private book storage."));
  });
}

async function transactBookStore(mode, action) {
  const database = await openBookshelf();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    let result;
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(request.error || new Error("Could not access a private book."));
    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Private book storage failed."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error("Private book storage was interrupted."));
    };
  });
}

export async function listPrivateBooks() {
  const entries = await transactBookStore("readonly", (store) => store.getAll());
  return entries
    .map(({ file, ...metadata }) => metadata)
    .sort((left, right) => right.addedAt.localeCompare(left.addedAt));
}

export async function savePrivateBook(file) {
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf")
      || (file.type && file.type !== "application/pdf")) {
    throw new Error("Choose a PDF file to add to your private shelf.");
  }
  if (file.size === 0 || file.size > MAX_PRIVATE_BOOK_BYTES) {
    throw new Error(`PDFs must be between 1 byte and ${MAX_PRIVATE_BOOK_BYTES / 1024 / 1024} MB.`);
  }
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(header) !== "%PDF-") {
    throw new Error("This file is not a valid PDF.");
  }

  const entry = {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.pdf$/i, ""),
    file,
    size: file.size,
    addedAt: new Date().toISOString(),
    type: file.type,
  };
  await transactBookStore("readwrite", (store) => store.add(entry));
  const { file: _storedFile, ...metadata } = entry;
  return metadata;
}

export async function getPrivateBook(id) {
  const entry = await transactBookStore("readonly", (store) => store.get(id));
  if (!entry) throw new Error("This PDF is no longer in the private shelf.");
  return entry;
}

export async function deletePrivateBook(id) {
  await transactBookStore("readwrite", (store) => store.delete(id));
}
