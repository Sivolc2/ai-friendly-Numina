// Types for photo interactions (loves and comments)

export interface PhotoComment {
  id: string;
  photoUrl: string;
  profileId: string; // Owner of the photo
  commenterProfileId: string;
  commentText: string;
  parentCommentId?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  commenterProfile?: {
    id: string;
    name: string;
    coverPhoto?: string;
  };
}

export interface PhotoLove {
  id: string;
  photoUrl: string;
  profileId: string; // Owner of the photo
  loverProfileId: string;
  createdAt: string;
  // Populated relations
  loverProfile?: {
    id: string;
    name: string;
    coverPhoto?: string;
  };
}

export interface PhotoStats {
  loves: number;
  comments: number;
  userLoved: boolean;
}

export interface PhotoInteractionResult {
  success: boolean;
  loved?: boolean;
  loveCount?: number;
  error?: string;
}