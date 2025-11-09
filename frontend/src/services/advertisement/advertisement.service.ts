import { Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';

export interface SimpleAdvertisement {
  id: string;
  imageUrl: string; // Can be file path, URL, or base64
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdvertisementService {
  constructor(private httpService: HttpService) {}

  /**
   * Fetch advertisements from the server API
   * Returns SimpleAdvertisement array for the carousel component
   */
  async fetchAdvertisementsFromAPI(): Promise<SimpleAdvertisement[]> {
    try {
      const response: any = await this.httpService.get('/advertisements');

      if (!response || !Array.isArray(response)) {
        console.warn('Advertisement API returned invalid format');
        return [];
      }

      // Transform server response to SimpleAdvertisement format
      const ads: SimpleAdvertisement[] = response.map((ad: any) => ({
        id: ad.id || ad._id || String(Math.random()),
        imageUrl: ad.imageUrl || ad.image || ad.base64Image || '',
        link: ad.link || ad.url || ad.targetUrl || ''
      }));

      const validAds = ads.filter(ad => ad.imageUrl);
      console.log(`Loaded ${validAds.length} advertisement(s) from server`);
      return validAds;
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      return [];
    }
  }
}

