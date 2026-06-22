import { supabase } from './lib/supabase';

// Map username to a fake email address transparently
const getFakeEmail = (username) => `${username.trim().toLowerCase()}@ptm.sch.id`;

export const api = {
  // Auth
  login: async (username, password) => {
    const email = getFakeEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    // Fetch the user's profile metadata from public.user_profiles
    const { data: profile, error: pErr } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (pErr || !profile) {
      // Fallback if profile doesn't exist yet (e.g. first time admin)
      return {
        token: data.session.access_token,
        user: {
          id: data.user.id,
          username: username,
          role: 'admin',
          teacher_id: null
        }
      };
    }

    return {
      token: data.session.access_token,
      user: {
        id: profile.id,
        username: profile.username,
        role: profile.role,
        teacher_id: profile.teacher_id
      }
    };
  },

  getMe: async () => {
    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr || !user) throw new Error('Sesi tidak ditemukan.');

    const { data: profile, error: pErr } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (pErr || !profile) {
      // Fallback
      return {
        id: user.id,
        username: user.email.split('@')[0],
        role: 'admin',
        teacher_id: null
      };
    }

    return {
      id: profile.id,
      username: profile.username,
      role: profile.role,
      teacher_id: profile.teacher_id
    };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Admins CRUD (Admin Only) via RPC
  getAdmins: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin')
      .order('username');
    if (error) throw error;
    return data;
  },

  createAdmin: async (data) => {
    const { data: res, error } = await supabase.rpc('create_admin_user', {
      p_username: data.username,
      p_password: data.password
    });
    if (error) throw error;
    if (res && res.error) throw new Error(res.error);
    return res;
  },

  updateAdmin: async (id, data) => {
    const { data: res, error } = await supabase.rpc('update_admin_user', {
      p_user_id: id,
      p_username: data.username,
      p_password: data.password || ''
    });
    if (error) throw error;
    if (res && res.error) throw new Error(res.error);
    return res;
  },

  deleteAdmin: async (id) => {
    const { data: res, error } = await supabase.rpc('delete_admin_user', {
      p_user_id: id
    });
    if (error) throw error;
    if (res && res.error) throw new Error(res.error);
    return res;
  },

  // Academic Years CRUD
  getAcademicYears: async () => {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('year', { ascending: false })
      .order('semester');
    if (error) throw error;
    return data;
  },

  createAcademicYear: async (data) => {
    const { data: res, error } = await supabase
      .from('academic_years')
      .insert({ year: data.year, semester: data.semester, is_active: false })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new Error(`Tahun Ajaran '${data.year}' Semester '${data.semester}' sudah ada.`);
      throw error;
    }
    return res;
  },

  updateAcademicYear: async (id, data) => {
    const { error } = await supabase
      .from('academic_years')
      .update({ year: data.year, semester: data.semester })
      .eq('id', id);
    if (error) {
      if (error.code === '23505') throw new Error(`Tahun Ajaran '${data.year}' Semester '${data.semester}' sudah ada.`);
      throw error;
    }
    return { success: true };
  },

  deleteAcademicYear: async (id) => {
    const { error } = await supabase
      .from('academic_years')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  activateAcademicYear: async (id) => {
    const { error: err1 } = await supabase
      .from('academic_years')
      .update({ is_active: false })
      .neq('id', id);
    if (err1) throw err1;

    const { error: err2 } = await supabase
      .from('academic_years')
      .update({ is_active: true })
      .eq('id', id);
    if (err2) throw err2;

    return { success: true };
  },

  // Teachers
  getTeachers: async () => {
    const { data: teachers, error: tErr } = await supabase
      .from('teachers')
      .select('*')
      .order('name');
    if (tErr) throw tErr;

    const { data: activeYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    let schedules = [];
    if (activeYear) {
      const { data: sData, error: sErr } = await supabase
        .from('schedules')
        .select(`
          teacher_id,
          time_slots!inner(is_recess)
        `)
        .eq('academic_year_id', activeYear.id)
        .eq('time_slots.is_recess', false);
      if (!sErr && sData) {
        schedules = sData;
      }
    }

    return teachers.map(t => {
      const teachingSlots = schedules.filter(s => s.teacher_id === t.id);
      return {
        ...t,
        current_jp: teachingSlots.length
      };
    });
  },

  createTeacher: async (data) => {
    const { data: res, error } = await supabase
      .from('teachers')
      .insert({
        name: data.name,
        title: data.title || null,
        code: data.code,
        target_jp: data.target_jp,
        color: data.color
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new Error(`Kode Guru '${data.code}' sudah digunakan.`);
      throw error;
    }
    return res;
  },

  updateTeacher: async (id, data) => {
    const { error } = await supabase
      .from('teachers')
      .update({
        name: data.name,
        title: data.title || null,
        code: data.code,
        target_jp: data.target_jp,
        color: data.color
      })
      .eq('id', id);
    if (error) {
      if (error.code === '23505') throw new Error(`Kode Guru '${data.code}' sudah digunakan.`);
      throw error;
    }
    return { success: true };
  },

  deleteTeacher: async (id) => {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Teacher credentials (Admin Only) via RPC
  getTeacherCredentials: async (teacherId) => {
    const { data, error } = await supabase.rpc('get_teacher_credentials', {
      p_teacher_id: teacherId
    });
    if (error) throw error;
    return data;
  },

  setTeacherCredentials: async (teacherId, username, password) => {
    const { data: res, error } = await supabase.rpc('set_teacher_credentials', {
      p_teacher_id: teacherId,
      p_username: username,
      p_password: password
    });
    if (error) throw error;
    if (res && res.error) throw new Error(res.error);
    return res;
  },

  // Classes
  getClasses: async () => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        homeroom:teachers!homeroom_teacher_id(name, title),
        co_homeroom:teachers!co_homeroom_teacher_id(name, title)
      `)
      .order('name');
    if (error) throw error;

    return data.map(c => ({
      ...c,
      homeroom_teacher_name: c.homeroom ? c.homeroom.name : null,
      homeroom_teacher_title: c.homeroom ? c.homeroom.title : null,
      co_homeroom_teacher_name: c.co_homeroom ? c.co_homeroom.name : null
    }));
  },

  createClass: async (data) => {
    const { data: res, error } = await supabase
      .from('classes')
      .insert({
        name: data.name,
        level: data.level,
        homeroom_teacher_id: data.homeroom_teacher_id,
        co_homeroom_teacher_id: data.co_homeroom_teacher_id
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new Error(`Nama Kelas '${data.name}' sudah ada.`);
      throw error;
    }
    return res;
  },

  updateClass: async (id, data) => {
    const { error } = await supabase
      .from('classes')
      .update({
        name: data.name,
        level: data.level,
        homeroom_teacher_id: data.homeroom_teacher_id,
        co_homeroom_teacher_id: data.co_homeroom_teacher_id
      })
      .eq('id', id);
    if (error) {
      if (error.code === '23505') throw new Error(`Nama Kelas '${data.name}' sudah ada.`);
      throw error;
    }
    return { success: true };
  },

  deleteClass: async (id) => {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Subjects
  getSubjects: async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  createSubject: async (data) => {
    const { data: res, error } = await supabase
      .from('subjects')
      .insert({ name: data.name, code: data.code })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new Error(`Kode Mapel '${data.code}' sudah terdaftar.`);
      throw error;
    }
    return res;
  },

  updateSubject: async (id, data) => {
    const { error } = await supabase
      .from('subjects')
      .update({ name: data.name, code: data.code })
      .eq('id', id);
    if (error) {
      if (error.code === '23505') throw new Error(`Kode Mapel '${data.code}' sudah terdaftar.`);
      throw error;
    }
    return { success: true };
  },

  deleteSubject: async (id) => {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Time Slots
  getTimeSlots: async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*');
    if (error) throw error;

    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return data.sort((a, b) => {
      const dayDiff = daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week);
      if (dayDiff !== 0) return dayDiff;
      return a.slot_number - b.slot_number;
    });
  },

  // Schedules
  getSchedules: async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        class_id,
        classes(name),
        time_slot_id,
        time_slots(day_of_week, start_time, end_time, slot_number, is_recess, label),
        subject_id,
        subjects(name, code),
        teacher_id,
        teachers(name, title, code, color),
        academic_years!inner(is_active)
      `)
      .eq('academic_years.is_active', true);
    if (error) throw error;

    return (data || []).map(s => ({
      id: s.id,
      class_id: s.class_id,
      class_name: s.classes ? s.classes.name : '',
      time_slot_id: s.time_slot_id,
      day_of_week: s.time_slots ? s.time_slots.day_of_week : '',
      start_time: s.time_slots ? s.time_slots.start_time : '',
      end_time: s.time_slots ? s.time_slots.end_time : '',
      slot_number: s.time_slots ? s.time_slots.slot_number : 0,
      is_recess: s.time_slots ? s.time_slots.is_recess : false,
      slot_label: s.time_slots ? s.time_slots.label : null,
      subject_id: s.subject_id,
      subject_name: s.subjects ? s.subjects.name : '',
      subject_code: s.subjects ? s.subjects.code : '',
      teacher_id: s.teacher_id,
      teacher_name: s.teachers ? s.teachers.name : '',
      teacher_title: s.teachers ? s.teachers.title : '',
      teacher_code: s.teachers ? s.teachers.code : '',
      teacher_color: s.teachers ? s.teachers.color : '#E2E8F0'
    }));
  },

  getSchedulesByClass: async (classId) => {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        class_id,
        time_slot_id,
        subject_id,
        subjects(name, code),
        teacher_id,
        teachers(name, code, color),
        academic_years!inner(is_active)
      `)
      .eq('class_id', classId)
      .eq('academic_years.is_active', true);
    if (error) throw error;

    return (data || []).map(s => ({
      id: s.id,
      class_id: s.class_id,
      time_slot_id: s.time_slot_id,
      subject_id: s.subject_id,
      subject_name: s.subjects ? s.subjects.name : '',
      subject_code: s.subjects ? s.subjects.code : '',
      teacher_id: s.teacher_id,
      teacher_name: s.teachers ? s.teachers.name : '',
      teacher_code: s.teachers ? s.teachers.code : '',
      teacher_color: s.teachers ? s.teachers.color : '#E2E8F0'
    }));
  },

  getSchedulesByTeacher: async (teacherId) => {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        class_id,
        classes(name),
        time_slot_id,
        time_slots(day_of_week, start_time, end_time, slot_number),
        subject_id,
        subjects(name, code),
        academic_years!inner(is_active)
      `)
      .eq('teacher_id', teacherId)
      .eq('academic_years.is_active', true);
    if (error) throw error;

    return (data || []).map(s => ({
      id: s.id,
      class_id: s.class_id,
      class_name: s.classes ? s.classes.name : '',
      time_slot_id: s.time_slot_id,
      day_of_week: s.time_slots ? s.time_slots.day_of_week : '',
      start_time: s.time_slots ? s.time_slots.start_time : '',
      end_time: s.time_slots ? s.time_slots.end_time : '',
      slot_number: s.time_slots ? s.time_slots.slot_number : 0,
      subject_id: s.subject_id,
      subject_name: s.subjects ? s.subjects.name : '',
      subject_code: s.subjects ? s.subjects.code : ''
    }));
  },

  saveSchedule: async (data) => {
    const { data: activeYear, error: yErr } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_active', true)
      .single();
    if (yErr || !activeYear) throw new Error('Tidak ada Tahun Ajaran aktif.');

    // Conflict Check
    const { data: conflict, error: cErr } = await supabase
      .from('schedules')
      .select('*, classes(name)')
      .eq('teacher_id', data.teacher_id)
      .eq('time_slot_id', data.time_slot_id)
      .eq('academic_year_id', activeYear.id)
      .neq('class_id', data.class_id);
    if (cErr) throw cErr;

    if (conflict && conflict.length > 0) {
      throw new Error(`Guru ini sudah mengajar di Kelas '${conflict[0].classes.name}' pada jam yang sama!`);
    }

    const { error } = await supabase
      .from('schedules')
      .upsert({
        class_id: data.class_id,
        time_slot_id: data.time_slot_id,
        subject_id: data.subject_id,
        teacher_id: data.teacher_id,
        academic_year_id: activeYear.id
      }, {
        onConflict: 'class_id,time_slot_id,academic_year_id'
      });
    if (error) throw error;
    return { success: true };
  },

  clearSchedule: async (classId, slotId) => {
    const { data: activeYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_active', true)
      .single();
    if (!activeYear) throw new Error('Tidak ada Tahun Ajaran aktif.');

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('class_id', classId)
      .eq('time_slot_id', slotId)
      .eq('academic_year_id', activeYear.id);
    if (error) throw error;
    return { success: true };
  }
};
