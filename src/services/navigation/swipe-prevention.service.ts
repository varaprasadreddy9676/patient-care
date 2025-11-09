import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class SwipePreventionService {
  private renderer: Renderer2;
  private swipeListeners: (() => void)[] = [];

  constructor(
    private platform: Platform,
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  /**
   * Prevent accidental swipe back on critical pages
   * @param element - The element to apply swipe prevention to
   * @param preventAll - Whether to prevent all swipe gestures
   */
  public preventSwipeBack(element: HTMLElement, preventAll = false): () => void {
    if (!this.platform.is('mobile')) {
      return () => {}; // No-op for desktop
    }

    // Add CSS class to prevent swipe
    this.renderer.addClass(element, 'no-swipe');

    let startX = 0;
    let startY = 0;
    const threshold = 50; // Minimum distance to trigger swipe

    const touchStartHandler = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const touchMoveHandler = (e: TouchEvent) => {
      if (preventAll) {
        e.preventDefault();
        return;
      }

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;

      // Prevent swipe back gesture (right to left on iOS/Android)
      if (Math.abs(diffX) > Math.abs(diffY)) { // Horizontal swipe
        if (diffX < -threshold && startX < 50) { // Swipe right from left edge
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      // Reset values
      startX = 0;
      startY = 0;
    };

    // Add event listeners
    const removeStartListener = this.renderer.listen(element, 'touchstart', touchStartHandler);
    const removeMoveListener = this.renderer.listen(element, 'touchmove', touchMoveHandler);
    const removeEndListener = this.renderer.listen(element, 'touchend', touchEndHandler);

    // Return cleanup function
    const cleanup = () => {
      this.renderer.removeClass(element, 'no-swipe');
      removeStartListener();
      removeMoveListener();
      removeEndListener();
    };

    this.swipeListeners.push(cleanup);
    return cleanup;
  }

  /**
   * Enable controlled swipe refresh while preventing navigation swipes
   * @param element - The element to apply controlled swipe to
   * @param onRefresh - Callback function for refresh action
   */
  public enableControlledSwipeRefresh(element: HTMLElement, onRefresh: () => void): () => void {
    if (!this.platform.is('mobile')) {
      return () => {}; // No-op for desktop
    }

    let startY = 0;
    let isRefreshing = false;
    const refreshThreshold = 100;

    const touchStartHandler = (e: TouchEvent) => {
      if (element.scrollTop <= 0) { // Only at top of scroll
        startY = e.touches[0].clientY;
      }
    };

    const touchMoveHandler = (e: TouchEvent) => {
      if (element.scrollTop > 0 || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;

      // Prevent default browser refresh but allow our custom refresh
      if (diffY > 10) { // Small threshold to avoid interference
        e.preventDefault();
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      if (element.scrollTop > 0 || isRefreshing) return;

      const currentY = e.changedTouches[0].clientY;
      const diffY = currentY - startY;

      if (diffY > refreshThreshold) {
        isRefreshing = true;
        onRefresh();
        
        // Reset after a delay
        setTimeout(() => {
          isRefreshing = false;
        }, 1000);
      }

      startY = 0;
    };

    // Add event listeners
    const removeStartListener = this.renderer.listen(element, 'touchstart', touchStartHandler);
    const removeMoveListener = this.renderer.listen(element, 'touchmove', touchMoveHandler, { passive: false });
    const removeEndListener = this.renderer.listen(element, 'touchend', touchEndHandler);

    // Return cleanup function
    const cleanup = () => {
      removeStartListener();
      removeMoveListener();
      removeEndListener();
    };

    this.swipeListeners.push(cleanup);
    return cleanup;
  }

  /**
   * Clean up all swipe listeners
   */
  public cleanupAll(): void {
    this.swipeListeners.forEach(cleanup => cleanup());
    this.swipeListeners = [];
  }
}