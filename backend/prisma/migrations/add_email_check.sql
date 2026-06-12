ALTER TABLE "gestion"."usuario" 
ADD CONSTRAINT "check_correo_format" 
CHECK ("correo" ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$');
