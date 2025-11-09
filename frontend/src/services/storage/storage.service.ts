import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storageMap = new Map<string, any>();
  private _storage: Storage | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private storage: Storage) {
    this.initPromise = this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    await this.getStoredData();
  }

  /**
   * Ensures storage is fully initialized before proceeding
   * @returns Promise that resolves when storage is ready
   */
  async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  public get(key: string) {
    return this.storageMap.get(key);
  }

  public async set(key: string, value: any, toLocalStore: boolean) {
    if (toLocalStore && this._storage) {
      await this._storage.set(key, value);
    }
    this.storageMap.set(key, value);
  }

  public async remove(key: string) {
    if (this._storage) {
      await this._storage.remove(key);
    }
    this.storageMap.delete(key);
  }

  public async clearStorage() {
    if (this._storage) {
      await this._storage.clear();
    }
    this.storageMap.clear();
  //  // // // console.log('Storage Cleared');
  }

  async getStoredData() {
    if (!this._storage) return;

    const _storageMap = new Map<string, any>();
    await this._storage.forEach((value, key) => {
    //  // // // console.log(key);
      try {
        _storageMap.set(key, value);
      } catch (e) {
        // // console.error(e);
      }
     // // // // console.log('.. Added');
    });
    this.storageMap = _storageMap;
  }
}
