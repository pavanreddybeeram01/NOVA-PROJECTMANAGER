-- NOVA — Team Productivity Platform
-- MySQL Database Schema

-- Select the NOVA database
USE `nova_db`;

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Admin', 'Manager', 'Member') DEFAULT 'Member',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `title` VARCHAR(100) DEFAULT 'Team Contributor',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `status` ENUM('Planning', 'In Progress', 'In Review', 'Completed') DEFAULT 'Planning',
  `color` VARCHAR(20) DEFAULT '#6366f1',
  `category` VARCHAR(50) DEFAULT 'Engineering',
  `budget` DECIMAL(10,2) DEFAULT 0.00,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`created_by`)
    REFERENCES `users`(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================
-- TASKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` ENUM(
    'todo',
    'in_progress',
    'in_review',
    'completed'
  ) DEFAULT 'todo',
  `priority` ENUM(
    'Low',
    'Medium',
    'High',
    'Urgent'
  ) DEFAULT 'Medium',
  `assignee_id` INT DEFAULT NULL,
  `due_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`project_id`)
    REFERENCES `projects`(`id`)
    ON DELETE CASCADE,

  FOREIGN KEY (`assignee_id`)
    REFERENCES `users`(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================
-- SUBTASKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `subtasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `completed` TINYINT(1) DEFAULT 0,

  FOREIGN KEY (`task_id`)
    REFERENCES `tasks`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================
-- TASK COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `task_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`task_id`)
    REFERENCES `tasks`(`id`)
    ON DELETE CASCADE,

  FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================
-- PROJECT MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `project_members` (
  `project_id` INT NOT NULL,
  `user_id` INT NOT NULL,

  PRIMARY KEY (`project_id`, `user_id`),

  FOREIGN KEY (`project_id`)
    REFERENCES `projects`(`id`)
    ON DELETE CASCADE,

  FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `project_id` INT DEFAULT NULL,
  `action` VARCHAR(255) NOT NULL,
  `details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================
-- CHECK TABLES
-- ============================================

SHOW TABLES;
