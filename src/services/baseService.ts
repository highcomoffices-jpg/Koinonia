import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export type TableName = keyof Database['public']['Tables'];
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type InsertDto<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type UpdateDto<T extends TableName> = Database['public']['Tables'][T]['Update'];

export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  eq?: Record<string, any>;
  neq?: Record<string, any>;
  gt?: Record<string, any>;
  gte?: Record<string, any>;
  lt?: Record<string, any>;
  lte?: Record<string, any>;
  like?: Record<string, string>;
  ilike?: Record<string, string>;
  in?: Record<string, any[]>;
}

export class BaseService<T extends TableName> {
  constructor(protected tableName: T) {}

  // CRUD Operations
  async findAll(options?: QueryOptions): Promise<Row<T>[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options?.select || '*');

      // Apply all filters
      query = this.applyFilters(query, options);

      // Apply ordering
      if (options?.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? true,
        });
      }

      // Apply pagination
      if (options?.limit !== undefined) {
        if (options.offset !== undefined) {
          query = query.range(options.offset, options.offset + options.limit - 1);
        } else {
          query = query.limit(options.limit);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch ${this.tableName}: ${handleSupabaseError(error)}`);
    }
  }

  async findById(id: string): Promise<Row<T> | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch ${this.tableName} by ID: ${handleSupabaseError(error)}`);
    }
  }

  async create(data: InsertDto<T>): Promise<Row<T>> {
    try {
      const { data: createdData, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return createdData;
    } catch (error) {
      throw new Error(`Failed to create ${this.tableName}: ${handleSupabaseError(error)}`);
    }
  }

  async update(id: string, data: UpdateDto<T>): Promise<Row<T>> {
    try {
      const { data: updatedData, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedData;
    } catch (error) {
      throw new Error(`Failed to update ${this.tableName}: ${handleSupabaseError(error)}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${handleSupabaseError(error)}`);
    }
  }

  // Helper methods
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Failed to count ${this.tableName}: ${handleSupabaseError(error)}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const { count } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      return (count || 0) > 0;
    } catch {
      return false;
    }
  }

  // Private helper to apply all filters
  private applyFilters(query: any, options?: QueryOptions) {
    if (!options) return query;

    // Equality filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Custom equality
    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Not equal
    if (options.neq) {
      Object.entries(options.neq).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.neq(key, value);
        }
      });
    }

    // Greater than
    if (options.gt) {
      Object.entries(options.gt).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.gt(key, value);
        }
      });
    }

    // Greater than or equal
    if (options.gte) {
      Object.entries(options.gte).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.gte(key, value);
        }
      });
    }

    // Less than
    if (options.lt) {
      Object.entries(options.lt).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.lt(key, value);
        }
      });
    }

    // Less than or equal
    if (options.lte) {
      Object.entries(options.lte).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.lte(key, value);
        }
      });
    }

    // LIKE (case-sensitive)
    if (options.like) {
      Object.entries(options.like).forEach(([key, value]) => {
        if (value) {
          query = query.like(key, `%${value}%`);
        }
      });
    }

    // ILIKE (case-insensitive)
    if (options.ilike) {
      Object.entries(options.ilike).forEach(([key, value]) => {
        if (value) {
          query = query.ilike(key, `%${value}%`);
        }
      });
    }

    // IN array
    if (options.in) {
      Object.entries(options.in).forEach(([key, value]) => {
        if (value && Array.isArray(value) && value.length > 0) {
          query = query.in(key, value);
        }
      });
    }

    return query;
  }
}

// Factory function to create service instances
export const createService = <T extends TableName>(tableName: T) => {
  return new BaseService(tableName);
};