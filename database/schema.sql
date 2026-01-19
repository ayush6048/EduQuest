CREATE DATABASE IF NOT EXISTS eduquest;
USE eduquest;

-- Independent Tables
CREATE TABLE IF NOT EXISTS regulations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    academicYear VARCHAR(20),
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(20),
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS blooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50),
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS difficulties (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50),
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS units (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50),
    status VARCHAR(20)
);

-- Dependent Tables (Level 1)
CREATE TABLE IF NOT EXISTS programs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(20),
    duration INT,
    status VARCHAR(20),
    regulationId VARCHAR(50),
    FOREIGN KEY (regulationId) REFERENCES regulations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS faculty (
    id VARCHAR(50) PRIMARY KEY,
    empId VARCHAR(50),
    title VARCHAR(20),
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    branchId VARCHAR(50),
    type VARCHAR(50),
    password VARCHAR(255),
    status VARCHAR(20),
    FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE SET NULL
);

-- Dependent Tables (Level 2)
CREATE TABLE IF NOT EXISTS pb_mappings (
    id VARCHAR(50) PRIMARY KEY,
    programId VARCHAR(50),
    branchId VARCHAR(50),
    status VARCHAR(20),
    FOREIGN KEY (programId) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE CASCADE
);

-- Dependent Tables (Level 3)
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50),
    name VARCHAR(255),
    mappingId VARCHAR(50),
    regulationId VARCHAR(50),
    year VARCHAR(10),
    semester VARCHAR(10),
    credits INT,
    type VARCHAR(50),
    category VARCHAR(50),
    facultyId VARCHAR(50),
    status VARCHAR(20),
    FOREIGN KEY (mappingId) REFERENCES pb_mappings(id) ON DELETE SET NULL,
    FOREIGN KEY (regulationId) REFERENCES regulations(id) ON DELETE SET NULL,
    FOREIGN KEY (facultyId) REFERENCES faculty(id) ON DELETE SET NULL
);

-- Dependent Tables (Level 4)
CREATE TABLE IF NOT EXISTS fc_mappings (
    id VARCHAR(50) PRIMARY KEY,
    facultyId VARCHAR(50),
    courseId VARCHAR(50),
    academicYear VARCHAR(20),
    status VARCHAR(20),
    FOREIGN KEY (facultyId) REFERENCES faculty(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_outcomes (
    id VARCHAR(50) PRIMARY KEY,
    courseId VARCHAR(50),
    code VARCHAR(50),
    description TEXT,
    bloomId VARCHAR(50),
    status VARCHAR(20),
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (bloomId) REFERENCES blooms(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(50) PRIMARY KEY,
    courseId VARCHAR(50),
    text TEXT,
    marks INT,
    difficultyId VARCHAR(50),
    bloomId VARCHAR(50),
    unitId VARCHAR(50),
    co VARCHAR(50),
    status VARCHAR(20),
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (difficultyId) REFERENCES difficulties(id) ON DELETE SET NULL,
    FOREIGN KEY (bloomId) REFERENCES blooms(id) ON DELETE SET NULL,
    FOREIGN KEY (unitId) REFERENCES units(id) ON DELETE SET NULL
);
