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
        supabase.from('tokens').select('*, patient:patients(*), department:departments(*)')
      ]);

      const dbDepartments = deptRes.data || [];
      if (dbDepartments.length > 0) setDepartments(dbDepartments);
      
      const demoPatients = [
        { id: 'p1', name: 'Rajesh Kumar', mobile: '9876543210', dob: '1985-05-12', gender: 'Male', uhid: 'UHID-123456', abha_id: 'rajesh@abdm' },
        { id: 'p2', name: 'Suman Lata', mobile: '9988776655', dob: '1970-11-20', gender: 'Female', uhid: 'UHID-789012', abha_id: 'suman@abdm' },
        { id: 'p3', name: 'Amit Singh', mobile: '9123456789', dob: '1992-03-15', gender: 'Male', uhid: 'UHID-345678', abha_id: null },
        { id: 'p4', name: 'Vijay Sharma', mobile: '9000000001', dob: '1955-08-05', gender: 'Male', uhid: 'UHID-999001', abha_id: 'vijay@abdm' },
        { id: 'p5', name: 'Priya Verma', mobile: '9000000002', dob: '1998-12-12', gender: 'Female', uhid: 'UHID-999002', abha_id: 'priya@abdm' },
        { id: 'p6', name: 'Anil Gupta', mobile: '9000000003', dob: '1982-06-25', gender: 'Male', uhid: 'UHID-999003', abha_id: null },
        { id: 'p7', name: 'Meena Devi', mobile: '9000000004', dob: '1965-02-14', gender: 'Female', uhid: 'UHID-999004', abha_id: 'meena@abdm' }
      ];
      setPatients([...(patientRes.data || []), ...demoPatients]);

      const dbTokens = tokenRes.data || [];
      const demoTokens: any[] = [];
      
      // Generate varied tokens for each department to fill the UI
      if (dbDepartments.length > 0) {
        dbDepartments.forEach((dept, idx) => {
          // Add 2 waiting patients per department
          demoTokens.push({
            id: `demo-t-w1-${dept.id}`,
            token_number: `${dept.code}-${101 + idx}`,
            patient_id: demoPatients[idx % demoPatients.length].id,
            dept_id: dept.id,
            status: 'waiting',
            priority: idx % 3 === 0 ? 'senior_citizen' : 'standard',
            generated_at: new Date(Date.now() - (idx * 300000)).toISOString(),
            patient: demoPatients[idx % demoPatients.length],
            department: dept
          });
          demoTokens.push({
            id: `demo-t-w2-${dept.id}`,
            token_number: `${dept.code}-${201 + idx}`,
            patient_id: demoPatients[(idx + 1) % demoPatients.length].id,
            dept_id: dept.id,
            status: 'waiting',
            priority: 'standard',
            generated_at: new Date(Date.now() - (idx * 400000)).toISOString(),
            patient: demoPatients[(idx + 1) % demoPatients.length],
            department: dept
          });
          // Add 1 in-consultation patient for the first 3 departments
          if (idx < 3) {
            demoTokens.push({
              id: `demo-t-c-${dept.id}`,
              token_number: `${dept.code}-050`,
              patient_id: demoPatients[(idx + 2) % demoPatients.length].id,
              dept_id: dept.id,
              status: 'in_consultation',
              priority: 'standard',
              generated_at: new Date(Date.now() - 1800000).toISOString(),
              patient: demoPatients[(idx + 2) % demoPatients.length],
              department: dept
            });
          }
        });
      }

      setTokens([...dbTokens, ...demoTokens]);
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
