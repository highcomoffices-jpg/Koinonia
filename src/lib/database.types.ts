export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // =====================================================
      // GEOGRAPHIC TABLES
      // =====================================================
      continents: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string | null
        }
        Relationships: []
      }
      sub_regions: {
        Row: {
          id: string
          name: string
          continent_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          continent_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          continent_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_regions_continent_id_fkey"
            columns: ["continent_id"]
            isOneToOne: false
            referencedRelation: "continents"
            referencedColumns: ["id"]
          }
        ]
      }
      countries: {
        Row: {
          id: string
          name: string
          code: string
          continent_id: string
          sub_region_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          continent_id: string
          sub_region_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          continent_id?: string
          sub_region_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "countries_continent_id_fkey"
            columns: ["continent_id"]
            isOneToOne: false
            referencedRelation: "continents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "countries_sub_region_id_fkey"
            columns: ["sub_region_id"]
            isOneToOne: false
            referencedRelation: "sub_regions"
            referencedColumns: ["id"]
          }
        ]
      }
      cities: {
        Row: {
          id: string
          name: string
          country_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          country_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          country_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // RELIGIOUS TABLES
      // =====================================================
      confessions: {
        Row: {
          id: string
          name: string
          description: string | null
          validated: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          validated?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          validated?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      parishes: {
        Row: {
          id: string
          name: string
          confession_id: string
          city_id: string
          address: string | null
          validated: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          confession_id: string
          city_id: string
          address?: string | null
          validated?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          confession_id?: string
          city_id?: string
          address?: string | null
          validated?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parishes_confession_id_fkey"
            columns: ["confession_id"]
            isOneToOne: false
            referencedRelation: "confessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parishes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          }
        ]
      }
      celebrations: {
        Row: {
          id: string
          name: string
          description: string | null
          date: string
          celebration_type: string
          confession_id: string | null
          color_hex: string | null
          is_public: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          date: string
          celebration_type: string
          confession_id?: string | null
          color_hex?: string | null
          is_public?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          date?: string
          celebration_type?: string
          confession_id?: string | null
          color_hex?: string | null
          is_public?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "celebrations_confession_id_fkey"
            columns: ["confession_id"]
            isOneToOne: false
            referencedRelation: "confessions"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // AUTH & PROFILE TABLES
      // =====================================================
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          profile_complete: boolean | null
          role: string | null
          level: string | null
          country_id: string | null
          city_id: string | null
          confession_id: string | null
          parish_id: string | null
          avatar_url: string | null
          bio: string | null
          default_visibility: string | null
          shepherd_grade: string | null
          superior_id: string | null
          validation_status: string | null
          vigneron_verified: boolean | null
          vigneron_certified_by: string | null
          spiritual_points: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          profile_complete?: boolean | null
          role?: string | null
          level?: string | null
          country_id?: string | null
          city_id?: string | null
          confession_id?: string | null
          parish_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          default_visibility?: string | null
          shepherd_grade?: string | null
          superior_id?: string | null
          validation_status?: string | null
          vigneron_verified?: boolean | null
          vigneron_certified_by?: string | null
          spiritual_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          profile_complete?: boolean | null
          role?: string | null
          level?: string | null
          country_id?: string | null
          city_id?: string | null
          confession_id?: string | null
          parish_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          default_visibility?: string | null
          shepherd_grade?: string | null
          superior_id?: string | null
          validation_status?: string | null
          vigneron_verified?: boolean | null
          vigneron_certified_by?: string | null
          spiritual_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_confession_id_fkey"
            columns: ["confession_id"]
            isOneToOne: false
            referencedRelation: "confessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // SOCIAL TABLES
      // =====================================================
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          media_urls: string[] | null
          video_urls: string[] | null
          visibility: string | null
          confession_ids: string[] | null
          parish_ids: string[] | null
          is_live: boolean | null
          likes_count: number | null
          comments_count: number | null
          shares_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          media_urls?: string[] | null
          video_urls?: string[] | null
          visibility?: string | null
          confession_ids?: string[] | null
          parish_ids?: string[] | null
          is_live?: boolean | null
          likes_count?: number | null
          comments_count?: number | null
          shares_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          media_urls?: string[] | null
          video_urls?: string[] | null
          visibility?: string | null
          confession_ids?: string[] | null
          parish_ids?: string[] | null
          is_live?: boolean | null
          likes_count?: number | null
          comments_count?: number | null
          shares_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          parent_id: string | null
          likes_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          parent_id?: string | null
          likes_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          parent_id?: string | null
          likes_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: {
          id: string
          user_id: string
          target_type: string
          target_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          target_type: string
          target_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          target_type?: string
          target_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      shares: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // MARKET TABLES
      // =====================================================
      market_items: {
        Row: {
          id: string
          seller_id: string
          title: string
          description: string
          category: string
          price: number | null
          condition: string | null
          location: string
          image_url: string | null
          images: string[] | null
          likes: number | null
          views: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          description: string
          category: string
          price?: number | null
          condition?: string | null
          location: string
          image_url?: string | null
          images?: string[] | null
          likes?: number | null
          views?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          description?: string
          category?: string
          price?: number | null
          condition?: string | null
          location?: string
          image_url?: string | null
          images?: string[] | null
          likes?: number | null
          views?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // SERVICES & FORMATIONS TABLES
      // =====================================================
      services: {
        Row: {
          id: string
          provider_id: string
          title: string
          description: string
          type: string
          confession_ids: string[] | null
          parish_id: string | null
          price: number | null
          duration: string | null
          max_participants: number | null
          current_participants: number | null
          requirements: string[] | null
          image_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          provider_id: string
          title: string
          description: string
          type: string
          confession_ids?: string[] | null
          parish_id?: string | null
          price?: number | null
          duration?: string | null
          max_participants?: number | null
          current_participants?: number | null
          requirements?: string[] | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          provider_id?: string
          title?: string
          description?: string
          type?: string
          confession_ids?: string[] | null
          parish_id?: string | null
          price?: number | null
          duration?: string | null
          max_participants?: number | null
          current_participants?: number | null
          requirements?: string[] | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      service_schedules: {
        Row: {
          id: string
          service_id: string
          date: string
          start_time: string
          end_time: string
          location: string | null
          is_online: boolean | null
          meeting_link: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          service_id: string
          date: string
          start_time: string
          end_time: string
          location?: string | null
          is_online?: boolean | null
          meeting_link?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          service_id?: string
          date?: string
          start_time?: string
          end_time?: string
          location?: string | null
          is_online?: boolean | null
          meeting_link?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_schedules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      formations: {
        Row: {
          id: string
          instructor_id: string
          title: string
          description: string
          category: string
          price: number | null
          duration: string
          confession_ids: string[] | null
          max_students: number | null
          current_students: number | null
          rating: number | null
          reviews_count: number | null
          image_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          instructor_id: string
          title: string
          description: string
          category: string
          price?: number | null
          duration: string
          confession_ids?: string[] | null
          max_students?: number | null
          current_students?: number | null
          rating?: number | null
          reviews_count?: number | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          instructor_id?: string
          title?: string
          description?: string
          category?: string
          price?: number | null
          duration?: string
          confession_ids?: string[] | null
          max_students?: number | null
          current_students?: number | null
          rating?: number | null
          reviews_count?: number | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      formation_modules: {
        Row: {
          id: string
          formation_id: string
          title: string
          description: string
          duration: string
          video_url: string | null
          resources: string[] | null
          order: number
          created_at: string | null
        }
        Insert: {
          id?: string
          formation_id: string
          title: string
          description: string
          duration: string
          video_url?: string | null
          resources?: string[] | null
          order: number
          created_at?: string | null
        }
        Update: {
          id?: string
          formation_id?: string
          title?: string
          description?: string
          duration?: string
          video_url?: string | null
          resources?: string[] | null
          order?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formation_modules_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          }
        ]
      }
      formation_enrollments: {
        Row: {
          id: string
          formation_id: string
          student_id: string
          progress: number | null
          completed: boolean | null
          certificate_url: string | null
          enrolled_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          formation_id: string
          student_id: string
          progress?: number | null
          completed?: boolean | null
          certificate_url?: string | null
          enrolled_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          formation_id?: string
          student_id?: string
          progress?: number | null
          completed?: boolean | null
          certificate_url?: string | null
          enrolled_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formation_enrollments_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formation_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // COMMUNITY TABLES
      // =====================================================
      groups: {
        Row: {
          id: string
          name: string
          description: string
          type: string
          visibility: string | null
          creator_id: string
          image_url: string | null
          confession_ids: string[] | null
          max_members: number | null
          member_count: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          type: string
          visibility?: string | null
          creator_id: string
          image_url?: string | null
          confession_ids?: string[] | null
          max_members?: number | null
          member_count?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          type?: string
          visibility?: string | null
          creator_id?: string
          image_url?: string | null
          confession_ids?: string[] | null
          max_members?: number | null
          member_count?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          type: string
          name: string | null
          group_id: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          type: string
          name?: string | null
          group_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          name?: string | null
          group_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          type: string | null
          media_url: string | null
          is_edited: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          type?: string | null
          media_url?: string | null
          is_edited?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          type?: string | null
          media_url?: string | null
          is_edited?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // ACTIVITY TABLES
      // =====================================================
      activities: {
        Row: {
          id: string
          title: string
          description: string
          activity_type: string
          parish_id: string | null
          date_start: string
          date_end: string | null
          location: string
          max_participants: number | null
          current_participants: number | null
          status: string | null
          is_active: boolean | null
          image_url: string | null
          organizer_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          activity_type: string
          parish_id?: string | null
          date_start: string
          date_end?: string | null
          location: string
          max_participants?: number | null
          current_participants?: number | null
          status?: string | null
          is_active?: boolean | null
          image_url?: string | null
          organizer_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          activity_type?: string
          parish_id?: string | null
          date_start?: string
          date_end?: string | null
          location?: string
          max_participants?: number | null
          current_participants?: number | null
          status?: string | null
          is_active?: boolean | null
          image_url?: string | null
          organizer_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_participants: {
        Row: {
          id: string
          activity_id: string
          user_id: string
          status: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          activity_id: string
          user_id: string
          status?: string | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          activity_id?: string
          user_id?: string
          status?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // =====================================================
      // PREMIUM FEATURES TABLES
      // =====================================================
      live_celebrations: {
        Row: {
          id: string
          celebration_id: string | null
          organizer_id: string
          title: string
          description: string | null
          stream_url: string | null
          is_active: boolean | null
          viewer_count: number | null
          started_at: string | null
          ended_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          celebration_id?: string | null
          organizer_id: string
          title: string
          description?: string | null
          stream_url?: string | null
          is_active?: boolean | null
          viewer_count?: number | null
          started_at?: string | null
          ended_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          celebration_id?: string | null
          organizer_id?: string
          title?: string
          description?: string | null
          stream_url?: string | null
          is_active?: boolean | null
          viewer_count?: number | null
          started_at?: string | null
          ended_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_celebrations_celebration_id_fkey"
            columns: ["celebration_id"]
            isOneToOne: false
            referencedRelation: "celebrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_celebrations_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      biblical_paths: {
        Row: {
          id: string
          title: string
          description: string
          author_id: string | null
          duration: number | null
          difficulty: string | null
          content: string | null
          image_url: string | null
          is_public: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          author_id?: string | null
          duration?: number | null
          difficulty?: string | null
          content?: string | null
          image_url?: string | null
          is_public?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          author_id?: string | null
          duration?: number | null
          difficulty?: string | null
          content?: string | null
          image_url?: string | null
          is_public?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biblical_paths_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      location_meditations: {
        Row: {
          id: string
          location_name: string
          city_id: string | null
          description: string | null
          meditation_text: string | null
          author_id: string | null
          image_url: string | null
          coordinates: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          location_name: string
          city_id?: string | null
          description?: string | null
          meditation_text?: string | null
          author_id?: string | null
          image_url?: string | null
          coordinates?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          location_name?: string
          city_id?: string | null
          description?: string | null
          meditation_text?: string | null
          author_id?: string | null
          image_url?: string | null
          coordinates?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_meditations_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_meditations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          }
        ]
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string
          type: string
          duration: string | null
          start_date: string
          end_date: string
          image_url: string | null
          is_active: boolean | null
          participants_count: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          type: string
          duration?: string | null
          start_date: string
          end_date: string
          image_url?: string | null
          is_active?: boolean | null
          participants_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          type?: string
          duration?: string | null
          start_date?: string
          end_date?: string
          image_url?: string | null
          is_active?: boolean | null
          participants_count?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          progress: number | null
          status: string | null
          joined_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          progress?: number | null
          status?: string | null
          joined_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          progress?: number | null
          status?: string | null
          joined_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      prayer_wall: {
        Row: {
          id: string
          author_id: string | null
          title: string
          content: string
          intention: string | null
          is_anonymous: boolean | null
          is_public: boolean | null
          prayer_count: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          author_id?: string | null
          title: string
          content: string
          intention?: string | null
          is_anonymous?: boolean | null
          is_public?: boolean | null
          prayer_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string | null
          title?: string
          content?: string
          intention?: string | null
          is_anonymous?: boolean | null
          is_public?: boolean | null
          prayer_count?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayer_wall_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      donations: {
        Row: {
          id: string
          donor_id: string
          recipient_id: string | null
          amount: number
          currency: string | null
          status: string | null
          message: string | null
          is_anonymous: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          donor_id: string
          recipient_id?: string | null
          amount: number
          currency?: string | null
          status?: string | null
          message?: string | null
          is_anonymous?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          donor_id?: string
          recipient_id?: string | null
          amount?: number
          currency?: string | null
          status?: string | null
          message?: string | null
          is_anonymous?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      fundraisers: {
        Row: {
          id: string
          title: string
          description: string
          organizer_id: string
          goal_amount: number
          current_amount: number | null
          currency: string | null
          image_url: string | null
          status: string | null
          deadline: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          organizer_id: string
          goal_amount: number
          current_amount?: number | null
          currency?: string | null
          image_url?: string | null
          status?: string | null
          deadline?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          organizer_id?: string
          goal_amount?: number
          current_amount?: number | null
          currency?: string | null
          image_url?: string | null
          status?: string | null
          deadline?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraisers_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      fundraiser_donations: {
        Row: {
          id: string
          fundraiser_id: string
          donor_id: string
          amount: number
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          fundraiser_id: string
          donor_id: string
          amount: number
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          fundraiser_id?: string
          donor_id?: string
          amount?: number
          status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundraiser_donations_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "brebis" | "vigneron" | "admin"
      user_level: "semeur" | "moissonneur" | "berger"
      post_visibility: "global" | "restricted" | "extended"
      group_visibility: "public" | "private" | "secret"
      activity_status: "upcoming" | "ongoing" | "completed" | "cancelled"
      donation_status: "pending" | "completed" | "failed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}