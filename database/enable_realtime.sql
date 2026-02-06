-- Enable Supabase Realtime for the leave system tables
-- Run this in Supabase SQL Editor to enable real-time updates

-- Check which tables are already in realtime publication
-- Run this first to see current status:
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Then add ONLY the tables that are NOT in the list above:
-- (If you get "already member" error, skip that table)

-- Uncomment and run the ones you need:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE leaves;
-- ALTER PUBLICATION supabase_realtime ADD TABLE approvals;
