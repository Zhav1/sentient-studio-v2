/**
 * Platform Template Presets and Export Optimizer Agent
 * 
 * Handles platform-specific asset formatting and optimization:
 * - YouTube thumbnails (1280x720, 16:9)
 * - Instagram posts (1080x1080, 1:1)
 * - Instagram stories (1080x1920, 9:16)
 * - TikTok covers (1080x1920, 9:16)
 * - Twitter headers (1500x500, 3:1)
 */

// ============ PLATFORM TEMPLATES ============

export interface PlatformTemplate {
    id: string;
    name: string;
    platform: "youtube" | "instagram" | "tiktok" | "twitter" | "facebook";
    assetType: string;
    width: number;
    height: number;
    aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:1";
    guidelines: string;
    maxFileSize?: number; // in KB
    recommendedFormat?: string;
}

export const PLATFORM_TEMPLATES: Record<string, PlatformTemplate> = {
    youtube_thumbnail: {
        id: "youtube_thumbnail",
        name: "YouTube Thumbnail",
        platform: "youtube",
        assetType: "thumbnail",
        width: 1280,
        height: 720,
        aspectRatio: "16:9",
        guidelines: "Bold text, high contrast, expressive faces, clear focal point",
        maxFileSize: 2048,
        recommendedFormat: "jpg",
    },
    youtube_banner: {
        id: "youtube_banner",
        name: "YouTube Channel Banner",
        platform: "youtube",
        assetType: "banner",
        width: 2560,
        height: 1440,
        aspectRatio: "16:9",
        guidelines: "Safe area for text: center 1546x423px, brand-consistent colors",
        maxFileSize: 6144,
        recommendedFormat: "png",
    },
    instagram_post: {
        id: "instagram_post",
        name: "Instagram Post",
        platform: "instagram",
        assetType: "post",
        width: 1080,
        height: 1080,
        aspectRatio: "1:1",
        guidelines: "Clean aesthetic, brand colors, minimal text, eye-catching visuals",
        maxFileSize: 30720,
        recommendedFormat: "jpg",
    },
    instagram_story: {
        id: "instagram_story",
        name: "Instagram Story",
        platform: "instagram",
        assetType: "story",
        width: 1080,
        height: 1920,
        aspectRatio: "9:16",
        guidelines: "Vertical format, dynamic, swipe-up CTA space at bottom",
        maxFileSize: 30720,
        recommendedFormat: "jpg",
    },
    instagram_reel_cover: {
        id: "instagram_reel_cover",
        name: "Instagram Reel Cover",
        platform: "instagram",
        assetType: "reel_cover",
        width: 1080,
        height: 1920,
        aspectRatio: "9:16",
        guidelines: "Vertical, thumbnail-style, attention-grabbing",
        maxFileSize: 30720,
        recommendedFormat: "jpg",
    },
    tiktok_cover: {
        id: "tiktok_cover",
        name: "TikTok Video Cover",
        platform: "tiktok",
        assetType: "cover",
        width: 1080,
        height: 1920,
        aspectRatio: "9:16",
        guidelines: "Vertical format, dynamic, trend-aware, bold text",
    },
    twitter_header: {
        id: "twitter_header",
        name: "Twitter/X Header",
        platform: "twitter",
        assetType: "header",
        width: 1500,
        height: 500,
        aspectRatio: "3:1",
        guidelines: "Wide format, account for profile picture overlap on left",
    },
    twitter_post: {
        id: "twitter_post",
        name: "Twitter/X Post Image",
        platform: "twitter",
        assetType: "post",
        width: 1200,
        height: 675,
        aspectRatio: "16:9",
        guidelines: "Landscape preferred, clear message, minimal text",
    },
    facebook_cover: {
        id: "facebook_cover",
        name: "Facebook Page Cover",
        platform: "facebook",
        assetType: "cover",
        width: 820,
        height: 312,
        aspectRatio: "16:9",
        guidelines: "Account for mobile cropping, centered important elements",
    },
};

// ============ EXPORT OPTIMIZER ============

export interface ExportOptions {
    template: PlatformTemplate;
    quality?: number; // 0-100 for JPEG
    format?: "jpg" | "png" | "webp";
    addWatermark?: boolean;
}

export interface OptimizedExport {
    platform: string;
    assetType: string;
    dimensions: { width: number; height: number };
    format: string;
    estimatedSize: number;
    base64: string;
}

/**
 * Get template by ID or search by platform/type
 */
export function getTemplate(
    idOrPlatform: string,
    assetType?: string
): PlatformTemplate | undefined {
    // Direct ID lookup
    if (PLATFORM_TEMPLATES[idOrPlatform]) {
        return PLATFORM_TEMPLATES[idOrPlatform];
    }

    // Search by platform and asset type
    if (assetType) {
        const key = `${idOrPlatform}_${assetType}`;
        if (PLATFORM_TEMPLATES[key]) {
            return PLATFORM_TEMPLATES[key];
        }
    }

    // Fuzzy search
    const matches = Object.values(PLATFORM_TEMPLATES).filter(
        (t) =>
            t.platform === idOrPlatform ||
            t.assetType === idOrPlatform ||
            t.id.includes(idOrPlatform)
    );

    return matches[0];
}

/**
 * Get all templates for a platform
 */
export function getTemplatesForPlatform(
    platform: PlatformTemplate["platform"]
): PlatformTemplate[] {
    return Object.values(PLATFORM_TEMPLATES).filter(
        (t) => t.platform === platform
    );
}

/**
 * Get aspect ratio from template
 */
export function getAspectRatioFromTemplate(
    templateId: string
): PlatformTemplate["aspectRatio"] | undefined {
    const template = getTemplate(templateId);
    return template?.aspectRatio;
}

/**
 * Generate platform-optimized prompt additions
 */
export function getPlatformPromptAdditions(template: PlatformTemplate): string {
    const additions: string[] = [];

    // Aspect ratio guidance
    additions.push(`ASPECT RATIO: ${template.aspectRatio} (${template.width}x${template.height})`);

    // Platform-specific guidelines
    additions.push(`PLATFORM GUIDELINES: ${template.guidelines}`);

    // Platform-specific style hints
    switch (template.platform) {
        case "youtube":
            additions.push("STYLE: High contrast, bold typography, attention-grabbing");
            break;
        case "instagram":
            additions.push("STYLE: Aesthetic, cohesive with feed, visually pleasing");
            break;
        case "tiktok":
            additions.push("STYLE: Dynamic, trend-aware, youthful energy");
            break;
        case "twitter":
            additions.push("STYLE: Clean, professional, message-focused");
            break;
        case "facebook":
            additions.push("STYLE: Community-focused, warm, approachable");
            break;
    }

    return additions.join("\n");
}

// ============ BATCH EXPORT ============

export interface BatchExportRequest {
    imageBase64: string;
    templates: string[]; // Template IDs
    options?: Partial<ExportOptions>;
}

export interface BatchExportResult {
    success: boolean;
    exports: OptimizedExport[];
    errors: { templateId: string; error: string }[];
}

/**
 * Prepare batch export for multiple platforms
 * Note: Actual image resizing would require canvas API or image processing library
 * This returns the metadata and configurations needed
 */
export function prepareBatchExport(
    request: BatchExportRequest
): BatchExportResult {
    const exports: OptimizedExport[] = [];
    const errors: { templateId: string; error: string }[] = [];

    for (const templateId of request.templates) {
        const template = getTemplate(templateId);

        if (!template) {
            errors.push({
                templateId,
                error: `Unknown template: ${templateId}`,
            });
            continue;
        }

        exports.push({
            platform: template.platform,
            assetType: template.assetType,
            dimensions: { width: template.width, height: template.height },
            format: request.options?.format || template.recommendedFormat || "jpg",
            estimatedSize: 0, // Would calculate based on image size
            base64: request.imageBase64, // In production, would resize
        });
    }

    return {
        success: errors.length === 0,
        exports,
        errors,
    };
}
