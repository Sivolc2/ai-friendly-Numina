// Optional migration script to optimize existing images in your system
// WARNING: This is a one-time operation that will modify your storage

import { supabase } from '../lib/supabase';
import { createOptimizedImage } from './imageOptimization';

interface ExistingImage {
  id: string;
  url: string;
  bucket: string;
  path: string;
}

export class ImageMigrationService {
  private async fetchExistingImages(): Promise<ExistingImage[]> {
    console.log('Fetching existing images from profiles and events...');
    
    // Get all profile images
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, main_photo, cover_photo')
      .not('main_photo', 'is', null);
    
    // Get all event images  
    const { data: events } = await supabase
      .from('events')
      .select('id, cover_image')
      .not('cover_image', 'is', null);
    
    const images: ExistingImage[] = [];
    
    // Process profile images
    profiles?.forEach(profile => {
      if (profile.main_photo) {
        images.push({
          id: `profile-${profile.id}-main`,
          url: profile.main_photo,
          bucket: 'profiles',
          path: this.extractPathFromUrl(profile.main_photo)
        });
      }
      if (profile.cover_photo) {
        images.push({
          id: `profile-${profile.id}-cover`,
          url: profile.cover_photo,
          bucket: 'profiles', 
          path: this.extractPathFromUrl(profile.cover_photo)
        });
      }
    });
    
    // Process event images
    events?.forEach(event => {
      if (event.cover_image) {
        images.push({
          id: `event-${event.id}`,
          url: event.cover_image,
          bucket: 'events',
          path: this.extractPathFromUrl(event.cover_image)
        });
      }
    });
    
    return images;
  }
  
  private extractPathFromUrl(url: string): string {
    // Extract the path from Supabase storage URL
    const matches = url.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
    return matches ? matches[1] : '';
  }
  
  private async downloadImage(url: string): Promise<File> {
    console.log(`Downloading image: ${url.substring(0, 50)}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const filename = url.split('/').pop() || 'image.jpg';
    
    return new File([blob], filename, { type: blob.type });
  }
  
  private async optimizeAndReplace(image: ExistingImage): Promise<boolean> {
    try {
      console.log(`Optimizing image: ${image.id}`);
      
      // Download original image
      const originalFile = await this.downloadImage(image.url);
      
      // Create optimized versions
      const optimizedResult = await createOptimizedImage(
        originalFile,
        image.bucket === 'events' ? 'event' : 'profile'
      );
      
      // Upload optimized version (replace original)
      const { error } = await supabase.storage
        .from(image.bucket)
        .update(image.path, optimizedResult.optimized, {
          cacheControl: '31536000',
          upsert: true
        });
      
      if (error) {
        console.error(`Failed to upload optimized image for ${image.id}:`, error);
        return false;
      }
      
      console.log(`✅ Successfully optimized: ${image.id}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to optimize ${image.id}:`, error);
      return false;
    }
  }
  
  public async migrateAllImages(
    options: {
      dryRun?: boolean;
      batchSize?: number;
      delayBetweenBatches?: number;
    } = {}
  ) {
    const { dryRun = true, batchSize = 5, delayBetweenBatches = 2000 } = options;
    
    console.log(`🚀 Starting image migration (${dryRun ? 'DRY RUN' : 'LIVE MODE'})`);
    
    const images = await this.fetchExistingImages();
    console.log(`Found ${images.length} images to process`);
    
    if (dryRun) {
      console.log('DRY RUN - Images that would be processed:');
      images.forEach(img => console.log(`  - ${img.id}: ${img.url}`));
      return;
    }
    
    let processed = 0;
    let successful = 0;
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(images.length / batchSize)}`);
      
      const promises = batch.map(image => this.optimizeAndReplace(image));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        processed++;
        if (result.status === 'fulfilled' && result.value) {
          successful++;
        }
      });
      
      console.log(`Progress: ${processed}/${images.length} (${successful} successful)`);
      
      // Delay between batches to be gentle on the system
      if (i + batchSize < images.length) {
        console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    console.log(`🎉 Migration complete: ${successful}/${processed} images optimized successfully`);
  }
}

// Usage example (run in browser console or as a script)
export const runImageMigration = async () => {
  const migrationService = new ImageMigrationService();
  
  // First, run a dry run to see what would be processed
  console.log('Running dry run...');
  await migrationService.migrateAllImages({ dryRun: true });
  
  // If you want to run the actual migration, uncomment this:
  // console.log('Starting actual migration...');
  // await migrationService.migrateAllImages({ 
  //   dryRun: false,
  //   batchSize: 3, // Process 3 images at a time
  //   delayBetweenBatches: 3000 // Wait 3 seconds between batches
  // });
};

// Make it available in browser console for manual execution
if (process.env.NODE_ENV === 'development') {
  (window as any).runImageMigration = runImageMigration;
}