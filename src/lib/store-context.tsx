"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase";

export type TokenStatus = 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
export type PriorityCategory = 'standard' | 'emergency' | 'senior_citizen';

export interface Patient {
  id: string;
  uhid: string;
  abha_id: string | null;
  name: string;
  dob: string;
  gender: string;
  mobile: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Token {
  id: string;
  token_number: string;
  patient_id: string;
  dept_id: string;
  status: TokenStatus;
  priority: PriorityCategory;
  generated_at: string;
  completed_at: string | null;
  // Joined fields
  patient?: Patient;
  department?: Department;
}

interface StoreContextType {
  tokens: Token[];
  patients: Patient[];
  departments: Department[];
  loading: boolean;
  registerPatient: (patient: Omit<Patient, "id" | "uhid" | "created_at">) => Promise<Patient | null>;
  generateToken: (patientId: string, deptId: string, priority: PriorityCategory) => Promise<Token | null>;
  updateTokenStatus: (tokenId: string, status: TokenStatus) => Promise<void>;
  fetchQueue: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tokens')
      .select('*, patient:patients(*), department:departments(*)')
      .order('generated_at', { ascending: true });
    
    if (data) setTokens(data as Token[]);
    setLoading(false);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [deptRes, patientRes, tokenRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('patients').select('*'),
        supabase.from('tokens').select('*, patient:patients(*), department:departments(*)').order('generated_at', { ascending: true })
      ]);

      const dbDepartments = deptRes.data || [];
      if (dbDepartments.length > 0) setDepartments(dbDepartments);
      
      setPatients(patientRes.data || []);
      setTokens(tokenRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // Subscribe to real-time changes
    const tokenSubscription = supabase
      .channel('token-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tokenSubscription);
    };
  }, []);

  const registerPatient = async (patientData: Omit<Patient, "id" | "uhid" | "created_at">) => {
    const uhid = `UHID-${Date.now()}`; // Simple UHID generation logic for MVP
    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...patientData, uhid }])
      .select()
      .single();

    if (error) {
      console.error("Detailed Error registering patient:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }
    return data as Patient;
  };

  const generateToken = async (patientId: string, deptId: string, priority: PriorityCategory) => {
    // Get count for today's tokens in this dept to generate token number
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .eq('dept_id', deptId)
      .gte('generated_at', today);

    const dept = departments.find(d => d.id === deptId);
    const tokenNumber = `${dept?.code || 'A'}-${(count || 0) + 1}`;

    const { data, error } = await supabase
      .from('tokens')
      .insert([{ 
        patient_id: patientId, 
        dept_id: deptId, 
        priority, 
        token_number: tokenNumber,
        status: 'waiting'
      }])
      .select('*, patient:patients(*), department:departments(*)')
      .single();

    if (error) {
      console.error("Error generating token:", error);
      return null;
    }
    return data as Token;
  };

  const updateTokenStatus = async (tokenId: string, status: TokenStatus) => {
    const updates: any = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('tokens')
      .update(updates)
      .eq('id', tokenId);

    if (error) console.error("Error updating token:", error);
  };

  return (
    <StoreContext.Provider
      value={{
        tokens,
        patients,
        departments,
        loading,
        registerPatient,
        generateToken,
        updateTokenStatus,
        fetchQueue
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
