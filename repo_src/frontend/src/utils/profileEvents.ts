// Simple event system for profile updates
class ProfileEventEmitter extends EventTarget {
  emitProfileUpdate() {
    console.log('ProfileEventEmitter: Emitting profile update event');
    this.dispatchEvent(new CustomEvent('profileUpdate'));
  }

  emitProfileVisibilityChange() {
    console.log('ProfileEventEmitter: Emitting profile visibility change event');
    this.dispatchEvent(new CustomEvent('profileVisibilityChange'));
  }

  onProfileUpdate(callback: () => void) {
    this.addEventListener('profileUpdate', callback);
    return () => this.removeEventListener('profileUpdate', callback);
  }

  onProfileVisibilityChange(callback: () => void) {
    this.addEventListener('profileVisibilityChange', callback);
    return () => this.removeEventListener('profileVisibilityChange', callback);
  }
}

export const profileEvents = new ProfileEventEmitter();