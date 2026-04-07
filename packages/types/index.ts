// Export shared types and enums here
export * from "./enums";

// Add other exports as needed

import { MediaType, UserRole } from "./enums";

// Stub types for frontend build
export interface FeaturedContent {
	id: string;
	title: string;
	description?: string;
	media: Media[];
}

export interface Media {
	id: string;
	title: string;
	url: string;
	type: MediaType;
	artistId?: string;
}

export interface ArtistStats {
	artistId: string;
	playCount: number;
	followerCount: number;
}

export interface ResellerStats {
	resellerId: string;
	salesCount: number;
	commission: number;
}

export interface User {
	id: string;
	email: string;
	name?: string;
	role: UserRole;
}

export interface SharedMediaWithRelations extends Media {
	user?: User;
	categories?: string[];
	liked?: boolean;
	isSaved?: boolean;
	shareCount?: number;
	isExplicit?: boolean;
	lastPlayedAt?: Date | null;
	cloudinaryPublicId?: string | null;
}
