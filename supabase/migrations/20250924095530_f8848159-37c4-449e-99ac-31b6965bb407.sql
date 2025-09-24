-- Create the missing updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create E-FIR table for automated FIR generation
CREATE TABLE public.app_a857ad95a4_efirs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  efir_id TEXT NOT NULL UNIQUE,
  tourist_id TEXT NOT NULL REFERENCES app_a857ad95a4_tourists(tourist_id),
  user_id UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Filed', 'Closed')),
  description TEXT,
  assigned_to TEXT,
  filed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_a857ad95a4_efirs ENABLE ROW LEVEL SECURITY;

-- Create policies for E-FIR management
CREATE POLICY "Authenticated users can view E-FIRs" 
ON public.app_a857ad95a4_efirs 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create E-FIRs" 
ON public.app_a857ad95a4_efirs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update E-FIRs" 
ON public.app_a857ad95a4_efirs 
FOR UPDATE 
TO authenticated
USING (true);

-- Create function to auto-generate E-FIR ID
CREATE OR REPLACE FUNCTION public.generate_efir_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate E-FIR ID in format: EFIR-YYYY-NNNNNN
  NEW.efir_id := 'EFIR-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                 LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for E-FIR ID generation
CREATE TRIGGER generate_efir_id_trigger
  BEFORE INSERT ON public.app_a857ad95a4_efirs
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_efir_id();

-- Create updated_at trigger
CREATE TRIGGER update_efirs_updated_at
  BEFORE UPDATE ON public.app_a857ad95a4_efirs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();