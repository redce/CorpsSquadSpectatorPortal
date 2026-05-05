CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    team VARCHAR(100) NOT NULL,
    sport VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    at VARCHAR(20) NOT NULL,
    opponent VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    incentive VARCHAR(200)
);

-- NEW TABLE: Cadet sign-ups tracking specific cadet details
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    regiment VARCHAR(10) NOT NULL,
    company VARCHAR(10) NOT NULL,
    c_number VARCHAR(20) NOT NULL,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, c_number) -- Prevents the same C-Number from signing up twice for the same game
);

INSERT INTO users (username, password, role)
VALUES
    ('admin', 'iamabigfroghater', 'admin'),
    ('viewer', 'iamabigfroghater', 'viewer')
ON CONFLICT (username) DO NOTHING;

INSERT INTO events (team, sport, date, time, at, opponent, location, incentive)
VALUES
    ('Army', 'Football', '2026-10-10', '15:00:00', 'Home', 'Navy', 'Michie Stadium', 'Late recall'),
    ('Army', 'Hockey', '2026-11-05', '19:00:00', 'Neutral', 'Air Force', 'Madison Square Garden', 'Free food'),
    ('Army', 'Basketball', '2026-12-01', '18:30:00', 'Away', 'Bucknell', 'Sojka Pavilion', 'Spirit points');

-- NEW MOCK DATA: Automatically register a test cadet for the Army vs. Navy game
INSERT INTO event_registrations (event_id, first_name, last_name, regiment, company, c_number)
VALUES 
    (
        (SELECT id FROM events WHERE opponent = 'Navy'),
        'Minseok',
        'Kim',
        '3',
        'B',
        'C12345'
    )
ON CONFLICT (event_id, c_number) DO NOTHING;