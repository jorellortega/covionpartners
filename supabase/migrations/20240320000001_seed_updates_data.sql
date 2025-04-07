-- Insert sample updates
INSERT INTO updates (title, description, status, date, category, full_content) VALUES
(
    'New Features Coming Soon',
    'We''re working on exciting new features to enhance your experience.',
    'upcoming',
    '2024-03-20',
    'Feature Update',
    'We''re excited to announce several new features that will be rolling out soon to enhance your experience with our platform. These updates are designed to improve efficiency, user experience, and overall functionality.

Our team has been working diligently to bring you these improvements, taking into account user feedback and industry best practices.'
),
(
    'System Maintenance Notice',
    'Scheduled maintenance for performance improvements.',
    'upcoming',
    '2024-03-25',
    'Maintenance',
    'We will be performing scheduled maintenance to improve system performance and stability. During this time, some features may be temporarily unavailable.

The maintenance window is scheduled for minimal impact on your operations.'
),
(
    'Platform Enhancement',
    'Recent updates to improve platform stability and performance.',
    'completed',
    '2024-03-15',
    'Enhancement',
    'We have completed several platform enhancements to improve stability and performance. These updates include:

- Improved system response times
- Enhanced security measures
- Optimized database queries
- Updated UI components'
);

-- Insert sample documents for the first update
INSERT INTO documents (update_id, name, type, status, file_path) VALUES
(
    (SELECT id FROM updates WHERE title = 'New Features Coming Soon'),
    'Feature Agreement',
    'sign',
    'required',
    NULL
),
(
    (SELECT id FROM updates WHERE title = 'New Features Coming Soon'),
    'Training Materials',
    'download',
    'pending',
    'training-materials.pdf'
),
(
    (SELECT id FROM updates WHERE title = 'New Features Coming Soon'),
    'Feedback Form',
    'upload',
    'pending',
    NULL
);

-- Insert sample documents for the second update
INSERT INTO documents (update_id, name, type, status, file_path) VALUES
(
    (SELECT id FROM updates WHERE title = 'System Maintenance Notice'),
    'Maintenance Schedule',
    'download',
    'pending',
    'maintenance-schedule.pdf'
),
(
    (SELECT id FROM updates WHERE title = 'System Maintenance Notice'),
    'Impact Assessment',
    'download',
    'pending',
    'impact-assessment.pdf'
);

-- Insert sample documents for the third update
INSERT INTO documents (update_id, name, type, status, file_path) VALUES
(
    (SELECT id FROM updates WHERE title = 'Platform Enhancement'),
    'Release Notes',
    'download',
    'completed',
    'release-notes.pdf'
),
(
    (SELECT id FROM updates WHERE title = 'Platform Enhancement'),
    'User Feedback',
    'upload',
    'completed',
    NULL
); 