-- Migration 008: Forum System

DROP TABLE IF EXISTS forum_discussions;
CREATE TABLE forum_discussions (
    id TEXT PRIMARY KEY,
    
    restaurant_id TEXT,
    user_id TEXT,
    is_from_moderator BOOLEAN,
    discussion_name TEXT,
    discussion_description TEXT,
    
    
    discussion_status TEXT,

    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);


DROP TABLE IF EXISTS forum_comments;
CREATE TABLE forum_comments (
    id TEXT PRIMARY KEY,
    discussion_id TEXT,
    user_id TEXT,
    is_from_moderator BOOLEAN,
    
    comment_text TEXT,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    edited BOOLEAN,

    comment_status TEXT,
    
    
    -- Foreign Key
    FOREIGN KEY (discussion_id) REFERENCES forum_discussions(id) ON DELETE CASCADE
);
