-- Migration to add Action Type to Nodes
-- This allows storing the specific action (quote, invoice, email) separate from the structural type (start/step/end) if needed, 
-- OR we just use the `type` column if it's flexible enough.
-- The user request implies: "Creation de devis", "Creation de facture", "Mise en place", "Email".
-- Let's update the `type` check constraint if it exists, or just use `type` field flexibly.
-- The original table definition: type text default 'step'. No check constraint was added in the create script provided in context.

-- However, to be cleaner, let's add an `action_type` column for the specific logic, keeping `type` for graph structure (start/step/end).
alter table chantier_nodes 
add column if not exists action_type text default 'general'; -- 'quote', 'invoice', 'email', 'setup', 'general'

-- Update existing nodes to have 'general' action type
update chantier_nodes set action_type = 'general' where action_type is null;
