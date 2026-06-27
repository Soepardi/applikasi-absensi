import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, Users, BookOpen, GraduationCap, LayoutDashboard,
  Printer, Plus, Trash2, Edit, X, AlertTriangle, CheckCircle,
  ChevronLeft, Menu, Sun, Moon, EyeOff, TrendingUp, LogOut, Key, Settings
} from 'lucide-react';

import html2pdf from 'html2pdf.js';
import { api } from './api';
import { cn } from '@/lib/utils';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

export default function App() {
  const [activeTab, setActiveTab] = useState('scheduler');
  const printAreaRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(() => localStorage.getItem('sidebarHidden') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Mobile responsiveness check
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mobileLabels = {
    scheduler: 'Jadwal',
    dashboard: 'Dashboard',
    teachers: 'Guru',
    classes: 'Kelas',
    subjects: 'Mapel',
    settings: 'Setelan'
  };

  // Auth States
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Credentials Modal States (Admin Only)
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [credTeacher, setCredTeacher] = useState(null);
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [credStatusMsg, setCredStatusMsg] = useState('');

  // Settings - Admins CRUD
  const [admins, setAdmins] = useState([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState({ username: '', password: '' });
  const [isAdminEdit, setIsAdminEdit] = useState(false);

  // Settings - Academic Years CRUD
  const [academicYears, setAcademicYears] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [isAcademicYearModalOpen, setIsAcademicYearModalOpen] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState({ year: '', semester: 'Ganjil' });
  const [isAcademicYearEdit, setIsAcademicYearEdit] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState('calendar'); // 'calendar' or 'admins'

  // Data States
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection States
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [scheduleViewMode, setScheduleViewMode] = useState('class');

  // Modal States
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState({ name: '', title: '', code: '', target_jp: 0, color: '#E2E8F0' });
  const [isTeacherEdit, setIsTeacherEdit] = useState(false);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState({ name: '', level: 'VII', homeroom_teacher_id: '', co_homeroom_teacher_id: '' });
  const [isClassEdit, setIsClassEdit] = useState(false);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({ name: '', code: '' });
  const [isSubjectEdit, setIsSubjectEdit] = useState(false);

  // Cell Assignment Modal
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [cellParams, setCellParams] = useState({ classId: '', slotId: '', day: '', slotNum: '', start: '', end: '' });
  const [cellSubjectId, setCellSubjectId] = useState('');
  const [cellTeacherId, setCellTeacherId] = useState('');
  const [collisionWarning, setCollisionWarning] = useState('');
  const [isMerged, setIsMerged] = useState(false);

  useEffect(() => {
    setIsMerged(false);
  }, [cellTeacherId]);

  const pastelColors = [
    '#FEF08A', '#BAE6FD', '#FBCFE8', '#FCE7F3', '#FED7AA', '#FFEDD5', '#FEF3C7', '#FDE047',
    '#CFFAFE', '#BBF7D0', '#A7F3D0', '#86EFAC', '#93C5FD', '#60A5FA', '#C7D2FE', '#A5B4FC',
    '#DDD6FE', '#F472B6', '#E879F9', '#38BDF8', '#FCA5A5', '#F87171', '#EF4444', '#FB923C',
    '#F97316', '#EA580C', '#C084FC', '#818CF8'
  ];

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebarHidden', sidebarHidden);
  }, [sidebarHidden]);

  // Auth check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await api.getMe();
        setUser(me);
        if (me.role === 'teacher') {
          setScheduleViewMode('teacher');
        }
        await loadAllData(me);
      } catch (err) {
        if (err.message && err.message.includes('Supabase URL')) {
          setError(err.message);
        } else {
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
        }
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  const loadAllData = async (currentUser = user) => {
    setLoading(true);
    setError(null);
    try {
      const [tData, cData, sData, tsData, schedData, ayData] = await Promise.all([
        api.getTeachers(), api.getClasses(), api.getSubjects(),
        api.getTimeSlots(), api.getSchedules(), api.getAcademicYears()
      ]);
      setTeachers(tData);
      setClasses(cData);
      setSubjects(sData);
      setTimeSlots(tsData);
      setSchedules(schedData);
      setAcademicYears(ayData);

      const activeYear = ayData.find(ay => ay.is_active === 1 || ay.is_active === true || ay.is_active === '1');
      setActiveAcademicYear(activeYear || null);

      if (cData.length > 0 && !selectedClassId) setSelectedClassId(cData[0].id.toString());
      
      const loggedInUser = currentUser;
      if (tData.length > 0) {
        if (loggedInUser && loggedInUser.role === 'teacher') {
          setSelectedTeacherId(loggedInUser.teacher_id.toString());
        } else if (!selectedTeacherId) {
          setSelectedTeacherId(tData[0].id.toString());
        }
      }
    } catch (err) {
      setError('Failed to connect to MySQL backend. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError('Username dan password harus diisi.');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const data = await api.login(loginUsername, loginPassword);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      if (data.user.role === 'teacher') {
        setActiveTab('scheduler');
        setScheduleViewMode('teacher');
        setSelectedTeacherId(data.user.teacher_id.toString());
      } else {
        setActiveTab('scheduler');
      }
      
      await loadAllData(data.user);
    } catch (err) {
      setLoginError(err.message || 'Login gagal. Periksa kembali username dan password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore signout errors
    }
    localStorage.removeItem('token');
    setUser(null);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    setTeachers([]);
    setClasses([]);
    setSubjects([]);
    setTimeSlots([]);
    setSchedules([]);
  };

  // Settings - Admins CRUD
  const loadAdminsData = async () => {
    try {
      const data = await api.getAdmins();
      setAdmins(data);
    } catch (err) {
      alert('Gagal memuat data administrator: ' + err.message);
    }
  };

  const handleOpenAddAdmin = () => {
    setIsAdminEdit(false);
    setCurrentAdmin({ username: '', password: '' });
    setIsAdminModalOpen(true);
  };

  const handleOpenEditAdmin = (admin) => {
    setIsAdminEdit(true);
    setCurrentAdmin({ id: admin.id, username: admin.username, password: '' });
    setIsAdminModalOpen(true);
  };

  const handleSaveAdmin = async () => {
    if (!currentAdmin.username || (!isAdminEdit && !currentAdmin.password)) {
      alert('Username dan password wajib diisi.');
      return;
    }
    try {
      if (isAdminEdit) {
        await api.updateAdmin(currentAdmin.id, currentAdmin);
      } else {
        await api.createAdmin(currentAdmin);
      }
      setIsAdminModalOpen(false);
      loadAdminsData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan administrator.');
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (id === user.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    if (!confirm('Hapus administrator ini?')) return;
    try {
      await api.deleteAdmin(id);
      loadAdminsData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus administrator.');
    }
  };

  // Settings - Academic Years CRUD
  const handleOpenAddAcademicYear = () => {
    setIsAcademicYearEdit(false);
    setCurrentAcademicYear({ year: '2025/2026', semester: 'Ganjil' });
    setIsAcademicYearModalOpen(true);
  };

  const handleOpenEditAcademicYear = (ay) => {
    setIsAcademicYearEdit(true);
    setCurrentAcademicYear(ay);
    setIsAcademicYearModalOpen(true);
  };

  const handleSaveAcademicYear = async () => {
    if (!currentAcademicYear.year || !currentAcademicYear.semester) {
      alert('Tahun Ajaran dan Semester wajib diisi.');
      return;
    }
    try {
      if (isAcademicYearEdit) {
        await api.updateAcademicYear(currentAcademicYear.id, currentAcademicYear);
      } else {
        await api.createAcademicYear(currentAcademicYear);
      }
      setIsAcademicYearModalOpen(false);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan Tahun Ajaran.');
    }
  };

  const handleDeleteAcademicYear = async (id) => {
    const ay = academicYears.find(x => x.id === id);
    if (ay && ay.is_active) {
      alert('Tidak dapat menghapus Tahun Ajaran yang sedang aktif. Aktifkan Tahun Ajaran lain terlebih dahulu.');
      return;
    }
    if (!confirm('PERINGATAN: Menghapus Tahun Ajaran ini akan menghapus semua slot jadwal di dalamnya! Anda yakin ingin melanjutkan?')) return;
    try {
      await api.deleteAcademicYear(id);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus Tahun Ajaran.');
    }
  };

  const handleActivateAcademicYear = async (id) => {
    try {
      await api.activateAcademicYear(id);
      await loadAllData();
      alert('Tahun Ajaran berhasil diaktifkan. Jadwal telah diperbarui.');
    } catch (err) {
      alert(err.message || 'Gagal mengaktifkan Tahun Ajaran.');
    }
  };

  // Load admins when entering settings tab
  useEffect(() => {
    if (activeTab === 'settings' && user && user.role === 'admin') {
      loadAdminsData();
    }
  }, [activeTab]);

  const handleOpenCredentialsModal = async (teacher) => {
    setCredTeacher(teacher);
    setCredUsername('');
    setCredPassword('');
    setCredStatusMsg('');
    setIsCredentialsModalOpen(true);
    setCredLoading(true);
    try {
      const data = await api.getTeacherCredentials(teacher.id);
      if (data.hasCredentials) {
        setCredUsername(data.username);
        setCredStatusMsg('Guru ini sudah memiliki akun login aktif. Masukkan password baru untuk mengubahnya.');
      } else {
        setCredStatusMsg('Guru ini belum memiliki akun login. Tentukan username dan password baru.');
      }
    } catch (err) {
      alert('Gagal mengambil status kredensial: ' + err.message);
    } finally {
      setCredLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!credUsername || !credPassword) {
      alert('Username dan password harus diisi.');
      return;
    }
    setCredLoading(true);
    try {
      await api.setTeacherCredentials(credTeacher.id, credUsername, credPassword);
      alert('Kredensial login guru berhasil disimpan.');
      setIsCredentialsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Gagal menyimpan kredensial.');
    } finally {
      setCredLoading(false);
    }
  };

  const getScheduleEntry = (classId, slotId) =>
    schedules.find(s => s.class_id === parseInt(classId) && s.time_slot_id === parseInt(slotId));

  const getTeacherScheduleEntries = (teacherId, slotId) =>
    schedules.filter(s => s.teacher_id === parseInt(teacherId) && s.time_slot_id === parseInt(slotId));

  const handleCellClick = (day, slot) => {
    if (user && user.role === 'teacher') return;
    if (slot.is_recess) return;
    const existing = getScheduleEntry(selectedClassId, slot.id);
    setCellParams({ classId: selectedClassId, slotId: slot.id, day, slotNum: slot.slot_number, start: slot.start_time, end: slot.end_time });
    setCellSubjectId(existing ? existing.subject_id.toString() : '');
    setCellTeacherId(existing ? existing.teacher_id.toString() : '');
    setCollisionWarning('');
    setIsMerged(false);
    setIsCellModalOpen(true);
  };

  useEffect(() => {
    if (!cellTeacherId || !cellParams.slotId) { setCollisionWarning(''); return; }
    const conflict = schedules.find(
      s => s.teacher_id === parseInt(cellTeacherId) &&
           s.time_slot_id === parseInt(cellParams.slotId) &&
           s.class_id !== parseInt(cellParams.classId)
    );
    setCollisionWarning(conflict ? `PERINGATAN: Guru ini sudah mengajar di Kelas '${conflict.class_name}' pada jam yang sama!` : '');
  }, [cellTeacherId, cellParams.slotId, cellParams.classId, schedules]);

  const handleSaveCellAssignment = async () => {
    if (!cellSubjectId || !cellTeacherId) { alert('Pilih Mata Pelajaran dan Guru.'); return; }
    try {
      await api.saveSchedule({
        class_id: parseInt(cellParams.classId), time_slot_id: parseInt(cellParams.slotId),
        subject_id: parseInt(cellSubjectId), teacher_id: parseInt(cellTeacherId),
        ignore_conflict: isMerged
      });
      setIsCellModalOpen(false);
      loadAllData();
    } catch (err) { alert(err.message || 'Gagal menyimpan jadwal.'); }
  };

  const handleClearCellAssignment = async () => {
    try {
      await api.clearSchedule(cellParams.classId, cellParams.slotId);
      setIsCellModalOpen(false);
      loadAllData();
    } catch (err) { alert(err.message || 'Gagal menghapus slot.'); }
  };

  // CRUD: Teacher
  const handleOpenAddTeacher = () => {
    setIsTeacherEdit(false);
    setCurrentTeacher({ name: '', title: '', code: (teachers.length + 1).toString(), target_jp: 12, color: pastelColors[teachers.length % pastelColors.length] });
    setIsTeacherModalOpen(true);
  };
  const handleOpenEditTeacher = (t) => { setIsTeacherEdit(true); setCurrentTeacher(t); setIsTeacherModalOpen(true); };
  const handleSaveTeacher = async () => {
    try {
      if (isTeacherEdit) await api.updateTeacher(currentTeacher.id, currentTeacher);
      else await api.createTeacher(currentTeacher);
      setIsTeacherModalOpen(false); loadAllData();
    } catch (err) { alert(err.message || 'Gagal menyimpan data guru.'); }
  };
  const handleDeleteTeacher = async (id) => {
    if (!confirm('Hapus guru ini? Semua jadwal yang diajarnya akan terhapus.')) return;
    try { await api.deleteTeacher(id); loadAllData(); } catch (err) { alert(err.message); }
  };

  // CRUD: Class
  const handleOpenAddClass = () => {
    setIsClassEdit(false);
    setCurrentClass({ name: '', level: 'VII', homeroom_teacher_id: '', co_homeroom_teacher_id: '' });
    setIsClassModalOpen(true);
  };
  const handleOpenEditClass = (c) => {
    setIsClassEdit(true);
    setCurrentClass({ id: c.id, name: c.name, level: c.level, homeroom_teacher_id: c.homeroom_teacher_id?.toString() || '', co_homeroom_teacher_id: c.co_homeroom_teacher_id?.toString() || '' });
    setIsClassModalOpen(true);
  };
  const handleSaveClass = async () => {
    const data = { name: currentClass.name, level: currentClass.level, homeroom_teacher_id: currentClass.homeroom_teacher_id ? parseInt(currentClass.homeroom_teacher_id) : null, co_homeroom_teacher_id: currentClass.co_homeroom_teacher_id ? parseInt(currentClass.co_homeroom_teacher_id) : null };
    try {
      if (isClassEdit) await api.updateClass(currentClass.id, data);
      else await api.createClass(data);
      setIsClassModalOpen(false); loadAllData();
    } catch (err) { alert(err.message || 'Gagal menyimpan kelas.'); }
  };
  const handleDeleteClass = async (id) => {
    if (!confirm('Hapus kelas ini? Semua jadwalnya akan hilang.')) return;
    try { await api.deleteClass(id); loadAllData(); } catch (err) { alert(err.message); }
  };

  // CRUD: Subject
  const handleOpenAddSubject = () => { setIsSubjectEdit(false); setCurrentSubject({ name: '', code: '' }); setIsSubjectModalOpen(true); };
  const handleOpenEditSubject = (s) => { setIsSubjectEdit(true); setCurrentSubject(s); setIsSubjectModalOpen(true); };
  const handleSaveSubject = async () => {
    try {
      if (isSubjectEdit) await api.updateSubject(currentSubject.id, currentSubject);
      else await api.createSubject(currentSubject);
      setIsSubjectModalOpen(false); loadAllData();
    } catch (err) { alert(err.message || 'Gagal menyimpan mata pelajaran.'); }
  };
  const handleDeleteSubject = async (id) => {
    if (!confirm('Hapus mata pelajaran ini?')) return;
    try { await api.deleteSubject(id); loadAllData(); } catch (err) { alert(err.message); }
  };

  // Loading / Error screens
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Memverifikasi Sesi...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn("flex min-h-screen bg-background text-foreground", theme === 'light' ? 'light' : '')}>
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 rounded-full border border-border"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
        
        <div className="flex w-full">
          {/* Left Column: Form */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24 bg-background">
            <div className="mx-auto w-full max-w-sm lg:max-w-md">
              <div className="mb-8 flex flex-col items-start">
                <img
                  src="/logo.png"
                  alt="Pesantren Teknologi Majapahit"
                  className="h-16 object-contain mb-6 select-none"
                />
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Pesantren Teknologi Majapahit
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Sistem Informasi Jadwal Pelajaran Aktif
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username Anda"
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    disabled={isLoggingIn}
                    className="h-11 bg-muted/20 border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password Anda"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    disabled={isLoggingIn}
                    className="h-11 bg-muted/20 border-border"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-sm font-semibold mt-6 rounded-xl"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </div>
                  ) : (
                    'Masuk ke Sistem'
                  )}
                </Button>
              </form>

              <div className="mt-12 text-center border-t border-border pt-6">
                <p className="text-xs text-muted-foreground">
                  Kredensial login diberikan oleh administrator sekolah. Jika Anda lupa kredensial Anda, hubungi pihak IT Pesantren.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Cover Image */}
          <div className="hidden lg:block relative flex-1 w-0 select-none">
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src="/login.jpg"
              alt="Majapahit School Penjadwalan"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-indigo-500/10 mix-blend-screen" />
            
            {/* Cover Info */}
            <div className="absolute bottom-16 left-16 right-16 text-white z-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 backdrop-blur-md border border-primary/30 text-indigo-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Penjadwalan Aktif
              </span>
              <h2 className="text-4xl font-extrabold tracking-tight leading-tight max-w-lg">
                Membangun Generasi Rabbani Berbasis Teknologi
              </h2>
              <p className="text-indigo-100/80 text-sm max-w-md">
                Aplikasi scheduler otomatis untuk menyeimbangkan beban mengajar guru, mencegah bentrok jam pelajaran, dan mencetak jadwal F4 secara instan.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && timeSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Menghubungkan ke Database MySQL...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background gap-6">
        <AlertTriangle size={64} className="text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Koneksi Gagal</h2>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={() => loadAllData()}>Coba Lagi</Button>
      </div>
    );
  }

  const handleDownloadPdf = () => {
    const element = printAreaRef.current;
    if (!element) return;

    element.classList.add('generating-pdf');

    const opt = {
      margin: 0,
      filename: `Jadwal_Pelajaran_${scheduleViewMode === 'class' ? (currentClassObj?.name || 'Kelas') : (currentTeacherObj?.code || 'Guru')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: [330, 215], orientation: 'landscape' }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        element.classList.remove('generating-pdf');
      })
      .save()
      .catch((err) => {
        console.error('PDF Generation error:', err);
        element.classList.remove('generating-pdf');
      });
  };

  // Schedule grid helpers
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const getSlotsForDay = (day) => timeSlots.filter(ts => ts.day_of_week === day);
  const maxSlotsCount = Math.max(...daysOfWeek.map(d => getSlotsForDay(d).length));
  const slotIndices = Array.from({ length: maxSlotsCount }, (_, i) => i);

  const currentClassObj = classes.find(c => c.id.toString() === selectedClassId);
  const currentTeacherObj = teachers.find(t => t.id.toString() === selectedTeacherId);
  const scheduledCount = schedules.length;
  const totalSlotsQuota = teachers.reduce((acc, t) => acc + t.target_jp, 0);

  // Sidebar nav items
  const navItems = user && user.role === 'admin'
    ? [
        { id: 'scheduler', icon: Calendar, label: 'Scheduler Grid' },
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'teachers', icon: Users, label: 'Daftar Guru' },
        { id: 'classes', icon: GraduationCap, label: 'Manajemen Kelas' },
        { id: 'subjects', icon: BookOpen, label: 'Mata Pelajaran' },
        { id: 'settings', icon: Settings, label: 'Pengaturan Sistem' },
      ]
    : [
        { id: 'scheduler', icon: Calendar, label: 'Jadwal Saya' },
      ];

  const sidebarWidth = sidebarHidden ? 0 : sidebarCollapsed ? 72 : 260;

  return (
    <TooltipProvider>
      <div className={cn("flex min-h-screen bg-background text-foreground", theme === 'light' ? 'light' : '', isMobile ? "flex-col" : "flex-row")}>

        {isMobile && user && (
          <header className="sticky top-0 z-30 h-14 bg-card border-b border-border px-4 flex items-center justify-between no-print select-none shrink-0">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
              <span className="font-extrabold text-sm tracking-tight text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">PTM Scheduler</span>
            </div>
            
            <div className="flex items-center gap-3">
              {activeAcademicYear && (
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                  TA {activeAcademicYear.year}
                </span>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut size={16} />
              </Button>
            </div>
          </header>
        )}

        {/* ==========================================
           SIDEBAR
           ========================================== */}
        <aside
          className={cn(
            "fixed top-0 left-0 h-full z-40 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out no-print hidden lg:flex",
            sidebarHidden ? "-translate-x-full w-[260px]" : sidebarCollapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          {/* Logo Header */}
          <div className={cn("flex items-center gap-3 px-4 h-[70px] border-b border-border shrink-0", sidebarCollapsed && "justify-center px-2")}>
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain shrink-0 select-none"
            />
            {!sidebarCollapsed && (
              <span className="font-bold text-base bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent whitespace-nowrap">
                PTM
              </span>
            )}
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1 ml-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarHidden(true)}>
                      <EyeOff size={15} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sembunyikan sidebar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarCollapsed(true)}>
                      <ChevronLeft size={15} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Perkecil sidebar</TooltipContent>
                </Tooltip>
              </div>
            )}
            {sidebarCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarCollapsed(false)}>
                    <Menu size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Perluas sidebar</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Nav Menu */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {navItems.map(({ id, icon: Icon, label }) => {
              const isActive = activeTab === id;
              return (
                <Tooltip key={id} disableHoverableContent={!sidebarCollapsed}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        sidebarCollapsed ? "justify-center" : "",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!sidebarCollapsed && <span>{label}</span>}
                      {isActive && !sidebarCollapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
                </Tooltip>
              );
            })}
          </nav>

          <Separator />

          {/* Footer */}
          <div className={cn("p-3 space-y-2 shrink-0", sidebarCollapsed && "p-2 flex flex-col items-center")}>
            <Tooltip disableHoverableContent={!sidebarCollapsed}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full gap-2", sidebarCollapsed && "w-10 h-10 p-0")}
                  onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  {!sidebarCollapsed && <span className="text-xs">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                </Button>
              </TooltipTrigger>
              {sidebarCollapsed && <TooltipContent side="right">Toggle Theme</TooltipContent>}
            </Tooltip>

            <Tooltip disableHoverableContent={!sidebarCollapsed}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive", sidebarCollapsed && "w-10 h-10 p-0")}
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  {!sidebarCollapsed && <span className="text-xs">Logout ({user?.username})</span>}
                </Button>
              </TooltipTrigger>
              {sidebarCollapsed && <TooltipContent side="right">Logout</TooltipContent>}
            </Tooltip>

            {!sidebarCollapsed && (
              <div className="px-1 space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Database Connected
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeAcademicYear ? `TA ${activeAcademicYear.year} (${activeAcademicYear.semester})` : 'TA 2025/2026'}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Floating trigger when sidebar hidden */}
        {!isMobile && sidebarHidden && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSidebarHidden(false)}
                className="fixed left-4 top-4 z-50 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-primary/20 transition-all duration-200 no-print"
              >
                <Menu size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Tampilkan sidebar</TooltipContent>
          </Tooltip>
        )}

        {/* ==========================================
           MAIN CONTENT
           ========================================== */}
        <main
          className="flex-1 min-h-screen transition-all duration-300"
          style={{ 
            marginLeft: isMobile ? 0 : (sidebarHidden ? 0 : sidebarCollapsed ? 72 : 260),
            paddingBottom: isMobile ? '80px' : '0px'
          }}
        >
          <div className="p-4 sm:p-8 max-w-none">

            {/* ==========================================
               TAB 1: SCHEDULER
               ========================================== */}
            {activeTab === 'scheduler' && (
              <div>
                {/* Screen Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print content-header">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Jadwal Pelajaran</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Klik sel untuk mengatur atau mengedit jadwal.</p>
                  </div>
                  <Button onClick={handleDownloadPdf} className="gap-2 no-print">
                    <Printer size={16} />
                    Print Jadwal
                  </Button>
                </div>

                {/* Print / PDF Wrapper */}
                <div ref={printAreaRef} className="w-full">

                {/* Print Header (hidden on screen) */}
                <div className="print-header">
                  <h1>JADWAL PELAJARAN PESANTREN TEKNOLOGI MAJAPAHIT</h1>
                  <h2>TAHUN AJARAN {activeAcademicYear ? `${activeAcademicYear.year} - SEMESTER ${activeAcademicYear.semester.toUpperCase()}` : '2025/2026'}</h2>
                  <div className="print-header-meta">
                    {scheduleViewMode === 'class' ? (
                      <>
                        <span>Kelas: {currentClassObj?.name}</span>
                        <span>Wali Kelas: {currentClassObj?.homeroom_teacher_name || '-'}</span>
                      </>
                    ) : (
                      <>
                        <span>Guru: {currentTeacherObj?.name}</span>
                        <span>Kode: {currentTeacherObj?.code}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Controls Panel */}
                <Card className="mb-6 scheduler-controls-panel no-print">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-6 flex-wrap">
                      {user && user.role === 'admin' ? (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Mode Tampilan</Label>
                            <Select value={scheduleViewMode} onValueChange={setScheduleViewMode}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="class">Jadwal Kelas</SelectItem>
                                <SelectItem value="teacher">Jadwal Guru</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {scheduleViewMode === 'class' ? (
                            <div className="flex items-end gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Pilih Kelas</Label>
                                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              {currentClassObj?.homeroom_teacher_name && (
                                <div className="pb-1">
                                  <p className="text-xs text-muted-foreground">Wali Kelas</p>
                                  <p className="text-sm font-semibold">{currentClassObj.homeroom_teacher_name}{currentClassObj.homeroom_teacher_title ? `, ${currentClassObj.homeroom_teacher_title}` : ''}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Pilih Guru</Label>
                              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger className="w-[280px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {teachers.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()}>
                                      {t.name} {t.title ? `(${t.title})` : ''} — [{t.code}]
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Jadwal Pribadi</Label>
                          <p className="text-lg font-bold text-foreground">
                            {currentTeacherObj ? `${currentTeacherObj.name}${currentTeacherObj.title ? `, ${currentTeacherObj.title}` : ''} [Kode: ${currentTeacherObj.code}]` : 'Memuat data guru...'}
                          </p>
                        </div>
                      )}

                      <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                        {user && user.role === 'admin' ? (
                          <>
                            <div className="w-3 h-3 rounded border border-border" />
                            <span>Klik sel untuk assign/edit</span>
                          </>
                        ) : (
                          <span>Jadwal mengajar aktif Anda</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Grid + Pengampu */}
                <div className="scheduler-main-layout flex flex-col lg:flex-row gap-5 items-start">
                  {/* Timetable Grid */}
                  <div className="grid-wrapper flex-[3.2] overflow-x-auto rounded-xl border border-border shadow-sm bg-card">
                    <table className="schedule-grid-table">
                      <thead>
                        <tr>
                          <th className="time-col">WAKTU</th>
                          {daysOfWeek.map(day => <th key={day}>{day.toUpperCase()}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {slotIndices.map(slotIdx => {
                          const anyDayHasSlot = daysOfWeek.some(day => getSlotsForDay(day)[slotIdx]);
                          if (!anyDayHasSlot) return null;
                          let firstSlot = null;
                          for (const day of daysOfWeek) {
                            const s = getSlotsForDay(day)[slotIdx];
                            if (s) { firstSlot = s; break; }
                          }
                          const timeLabel = firstSlot ? `${firstSlot.start_time} - ${firstSlot.end_time}` : '';
                          return (
                            <tr key={slotIdx}>
                              <td className="time-col">{timeLabel}</td>
                              {daysOfWeek.map(day => {
                                const slotsForDay = getSlotsForDay(day);
                                const slot = slotsForDay[slotIdx];
                                if (!slot) return <td key={day} className="slot-none-cell" />;
                                if (slot.is_recess) return (
                                  <td key={day} className="recess-cell" title={slot.label}>({slot.label})</td>
                                );
                                if (scheduleViewMode === 'class') {
                                  const entry = getScheduleEntry(selectedClassId, slot.id);
                                  return (
                                    <td key={day} onClick={() => handleCellClick(day, slot)}>
                                      {entry ? (
                                        <div
                                          className="lesson-card"
                                          style={{
                                            backgroundColor: `${entry.teacher_color || '#E2E8F0'}25`,
                                            borderLeftColor: entry.teacher_color || '#E2E8F0'
                                          }}
                                        >
                                          <span className="lesson-subject">{entry.subject_code}</span>
                                          <span className="lesson-teacher">({entry.teacher_code})</span>
                                          <div className="cell-action-overlay" onClick={e => { e.stopPropagation(); handleCellClick(day, slot); }}>
                                            <Edit size={11} className="text-muted-foreground hover:text-foreground" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="cell-empty" />
                                      )}
                                    </td>
                                  );
                                } else {
                                  const entries = getTeacherScheduleEntries(selectedTeacherId, slot.id);
                                  return (
                                    <td key={day} style={{ cursor: 'default' }}>
                                      {entries.length > 0 ? (
                                        <div
                                          className="lesson-card"
                                          style={{
                                            backgroundColor: `${currentTeacherObj?.color || '#E2E8F0'}25`,
                                            borderLeftColor: currentTeacherObj?.color || '#E2E8F0',
                                            cursor: 'default'
                                          }}
                                        >
                                          <span className="lesson-subject">{entries.map(e => e.class_name).join(' + ')}</span>
                                          <span className="lesson-teacher">{entries[0].subject_code}</span>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                      )}
                                    </td>
                                  );
                                }
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pengampu sidebar — only shown in class view mode */}
                  {scheduleViewMode === 'class' && <div className="teacher-sidebar-table-wrapper flex-1 rounded-xl border border-border bg-card shadow-sm p-4">
                    <h3 className="sidebar-table-title text-sm font-bold mb-3 pl-2 border-l-2 border-primary text-card-foreground">Pengampu</h3>
                    <div className="teacher-table-container max-h-[600px] overflow-y-auto rounded-lg border border-border">
                      <table className="teacher-legend-table">
                        <thead>
                          <tr className="border-b border-border">
                            <th style={{ width: 36, textAlign: 'center' }} className="pb-2 text-muted-foreground font-semibold">No</th>
                            <th className="pb-2 text-muted-foreground font-semibold">Pengampu</th>
                            <th style={{ width: 40, textAlign: 'center' }} className="pb-2 text-muted-foreground font-semibold">JP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachers.filter(t => t.target_jp > 0).map(t => (
                            <tr key={t.id} className="border-b border-border/40 hover:bg-muted/30">
                              <td style={{ textAlign: 'center' }} className="py-2.5 font-mono font-bold text-muted-foreground">{t.code}</td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: t.color }} />
                                  <span className="font-medium text-foreground">{t.name}{t.title ? `, ${t.title}` : ''}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }} className="py-2.5 text-muted-foreground font-medium">{t.target_jp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>}
                </div>

                {/* Legend */}
                {scheduleViewMode === 'class' && (
                  <Card className="mt-6 legend-card">
                    <CardContent className="pt-5">
                      <h3 className="legend-card-title text-sm font-bold mb-3 pl-2 border-l-2 border-primary">Keterangan Singkatan</h3>
                      <div className="legend-subject-list-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                        {subjects
                          .filter(sb => schedules.some(s => s.subject_id === sb.id && s.class_id === parseInt(selectedClassId)))
                          .map(sb => (
                            <div key={sb.id} className="legend-subject-item flex gap-2 text-xs">
                              <span className="legend-subject-code font-bold text-primary w-[90px] shrink-0">{sb.code}</span>
                              <span className="text-muted-foreground">: {sb.name}</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                </div>
              </div>
            )}

            {/* ==========================================
               TAB 2: DASHBOARD
               ========================================== */}
            {activeTab === 'dashboard' && (
              <div>
                <div className="mb-8 content-header">
                  <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                  <p className="text-muted-foreground mt-1 text-sm">Statistik dan utilisasi jam pelajaran guru.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Guru', value: teachers.length, icon: Users, color: 'text-indigo-400' },
                    { label: 'Total Kelas', value: classes.length, icon: GraduationCap, color: 'text-emerald-400' },
                    { label: 'Total Mapel', value: subjects.length, icon: BookOpen, color: 'text-sky-400' },
                    { label: 'JP Terjadwal', value: `${scheduledCount} / ${totalSlotsQuota}`, icon: TrendingUp, color: 'text-amber-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}>
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                          <p className="text-2xl font-bold text-foreground">{value}</p>
                        </div>
                        <div className={cn("w-11 h-11 rounded-xl bg-muted flex items-center justify-center", color)}>
                          <Icon size={20} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Utilisasi Jam Pelajaran (JP) Guru</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Kode</TableHead>
                          <TableHead>Nama Guru</TableHead>
                          <TableHead className="w-28">Target JP</TableHead>
                          <TableHead className="w-28">JP Terpasang</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead className="w-28">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teachers.map(t => {
                          const isOver = t.current_jp > t.target_jp;
                          const isMatch = t.current_jp === t.target_jp;
                          const percentage = t.target_jp > 0 ? Math.min((t.current_jp / t.target_jp) * 100, 100) : 0;
                          return (
                            <TableRow key={t.id}>
                              <TableCell><span className="font-mono font-bold text-primary">{t.code}</span></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: t.color }} />
                                  <span>{t.name}{t.title ? `, ${t.title}` : ''}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{t.target_jp} JP</TableCell>
                              <TableCell>
                                <span className={cn("font-semibold", isOver ? "text-destructive" : isMatch ? "text-emerald-400" : "text-amber-400")}>
                                  {t.current_jp} JP
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full transition-all", isOver ? "bg-destructive" : isMatch ? "bg-emerald-500" : "bg-primary")}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-8">{Math.round(percentage)}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={isOver ? 'destructive' : isMatch ? 'success' : 'warning'}>
                                  {isOver ? 'Kelebihan' : isMatch ? 'Optimal' : 'Kurang'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==========================================
               TAB 3: TEACHERS CRUD
               ========================================== */}
            {activeTab === 'teachers' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 content-header">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Daftar Guru</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Kelola nama, kode, target JP, dan warna identitas guru.</p>
                  </div>
                  <Button onClick={handleOpenAddTeacher}><Plus size={16} />Tambah Guru</Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 pl-6">Kode</TableHead>
                          <TableHead>Nama Lengkap</TableHead>
                          <TableHead className="w-32">Target JP</TableHead>
                          <TableHead className="w-36">Warna Sel</TableHead>
                          <TableHead className="text-right pr-6">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teachers.map(t => (
                          <TableRow key={t.id}>
                            <TableCell className="pl-6"><span className="font-mono font-bold text-primary">{t.code}</span></TableCell>
                            <TableCell className="font-medium">{t.name}{t.title ? `, ${t.title}` : ''}</TableCell>
                            <TableCell><Badge variant="secondary">{t.target_jp} JP</Badge></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md border border-border/50 shrink-0" style={{ backgroundColor: t.color }} />
                                <span className="text-xs text-muted-foreground font-mono">{t.color}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleOpenCredentialsModal(t)}>
                                      <Key size={14} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Kredensial Login</TooltipContent>
                                </Tooltip>
                                <Button variant="outline" size="sm" onClick={() => handleOpenEditTeacher(t)}><Edit size={14} /></Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteTeacher(t.id)}><Trash2 size={14} /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==========================================
               TAB 4: CLASSES CRUD
               ========================================== */}
            {activeTab === 'classes' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 content-header">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Kelas</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Tambah kelas, atur tingkat, dan tunjuk wali kelas.</p>
                  </div>
                  <Button onClick={handleOpenAddClass}><Plus size={16} />Tambah Kelas</Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Nama Kelas</TableHead>
                          <TableHead className="w-24">Tingkat</TableHead>
                          <TableHead>Wali Kelas</TableHead>
                          <TableHead>Pendamping</TableHead>
                          <TableHead className="text-right pr-6">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classes.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="pl-6 font-bold">{c.name}</TableCell>
                            <TableCell><Badge variant="secondary">{c.level}</Badge></TableCell>
                            <TableCell>{c.homeroom_teacher_name ? `${c.homeroom_teacher_name}${c.homeroom_teacher_title ? ', ' + c.homeroom_teacher_title : ''}` : <span className="text-muted-foreground italic">Belum ditunjuk</span>}</TableCell>
                            <TableCell>{c.co_homeroom_teacher_name || <span className="text-muted-foreground italic">Tidak ada</span>}</TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenEditClass(c)}><Edit size={14} /></Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(c.id)}><Trash2 size={14} /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==========================================
               TAB 5: SUBJECTS CRUD
               ========================================== */}
            {activeTab === 'subjects' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 content-header">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mata Pelajaran</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Kelola kursus dan singkatan untuk sel jadwal.</p>
                  </div>
                  <Button onClick={handleOpenAddSubject}><Plus size={16} />Tambah Mapel</Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6 w-36">Singkatan (Kode)</TableHead>
                          <TableHead>Nama Lengkap Mata Pelajaran</TableHead>
                          <TableHead className="text-right pr-6">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjects.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="pl-6"><span className="font-mono font-bold text-primary">{s.code}</span></TableCell>
                            <TableCell>{s.name}</TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenEditSubject(s)}><Edit size={14} /></Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteSubject(s.id)}><Trash2 size={14} /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==========================================
               TAB 6: SYSTEM SETTINGS (ADMIN ONLY)
               ========================================== */}
            {activeTab === 'settings' && user?.role === 'admin' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 content-header">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Kelola akun administrator dan kalender tahun ajaran aktif.</p>
                  </div>
                  {settingsSubTab === 'calendar' ? (
                    <Button onClick={handleOpenAddAcademicYear} className="gap-2">
                      <Plus size={16} />
                      Tambah Tahun Ajaran
                    </Button>
                  ) : (
                    <Button onClick={handleOpenAddAdmin} className="gap-2">
                      <Plus size={16} />
                      Tambah Administrator
                    </Button>
                  )}
                </div>

                <div className="flex gap-4 mb-6">
                  <Button
                    variant={settingsSubTab === 'calendar' ? 'default' : 'outline'}
                    onClick={() => setSettingsSubTab('calendar')}
                    className="flex-1 sm:flex-initial"
                  >
                    Kalender Tahun Ajaran
                  </Button>
                  <Button
                    variant={settingsSubTab === 'admins' ? 'default' : 'outline'}
                    onClick={() => setSettingsSubTab('admins')}
                    className="flex-1 sm:flex-initial"
                  >
                    Manajemen Admin
                  </Button>
                </div>

                {settingsSubTab === 'calendar' ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Daftar Tahun Ajaran & Semester</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">Tahun Ajaran</TableHead>
                            <TableHead>Semester</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right pr-6">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {academicYears.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                Belum ada data tahun ajaran.
                              </TableCell>
                            </TableRow>
                          ) : (
                            academicYears.map(ay => (
                              <TableRow key={ay.id}>
                                <TableCell className="pl-6 font-semibold">{ay.year}</TableCell>
                                <TableCell>{ay.semester}</TableCell>
                                <TableCell>
                                  {ay.is_active ? (
                                    <Badge variant="success" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">Aktif</Badge>
                                  ) : (
                                    <Badge variant="secondary">Tidak Aktif</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex justify-end gap-2">
                                    {!ay.is_active && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => handleActivateAcademicYear(ay.id)}
                                      >
                                        Aktifkan
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenEditAcademicYear(ay)}
                                    >
                                      <Edit size={14} />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={ay.is_active}
                                      onClick={() => handleDeleteAcademicYear(ay.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Daftar Akun Administrator</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Tanggal Dibuat</TableHead>
                            <TableHead className="text-right pr-6">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {admins.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                Belum ada data administrator.
                              </TableCell>
                            </TableRow>
                          ) : (
                            admins.map(adm => (
                              <TableRow key={adm.id}>
                                <TableCell className="pl-6 font-semibold">{adm.username}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="capitalize">{adm.role}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {adm.created_at ? new Date(adm.created_at).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : '-'}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenEditAdmin(adm)}
                                    >
                                      <Edit size={14} />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={adm.id === user?.id}
                                      onClick={() => handleDeleteAdmin(adm.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

          </div>
        </main>

        {/* ==========================================
           MODAL: CELL ASSIGNMENT
           ========================================== */}
        <Dialog open={isCellModalOpen} onOpenChange={setIsCellModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Atur Jadwal — {cellParams.day}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-muted p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Kelas:</span> <strong>{currentClassObj?.name}</strong></p>
                <p><span className="text-muted-foreground">Slot:</span> <strong>{cellParams.slotNum} ({cellParams.start} – {cellParams.end})</strong></p>
              </div>

              {collisionWarning && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{collisionWarning}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <input
                      type="checkbox"
                      id="is-merged-class"
                      checked={isMerged}
                      onChange={(e) => setIsMerged(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-muted/20 text-primary focus:ring-primary cursor-pointer accent-amber-500"
                    />
                    <Label htmlFor="is-merged-class" className="text-xs font-semibold text-amber-500 cursor-pointer select-none uppercase tracking-wider">
                      Kelas Gabungan (Abaikan Tabrakan)
                    </Label>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Mata Pelajaran</Label>
                <Select value={cellSubjectId} onValueChange={setCellSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Mata Pelajaran..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Guru Pengampu</Label>
                <Select value={cellTeacherId} onValueChange={setCellTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Guru..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name} {t.title ? `(${t.title})` : ''} — [{t.code}] (JP: {t.current_jp}/{t.target_jp})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-between gap-2">
              <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10" onClick={handleClearCellAssignment}>
                Hapus Slot
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCellModalOpen(false)}>Batal</Button>
                <Button onClick={handleSaveCellAssignment} disabled={!!collisionWarning && !isMerged}>
                  Simpan Jadwal
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==========================================
           MODAL: TEACHER FORM
           ========================================== */}
        <Dialog open={isTeacherModalOpen} onOpenChange={setIsTeacherModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isTeacherEdit ? 'Edit Data Guru' : 'Tambah Guru Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nama Lengkap</Label>
                <Input placeholder="e.g. Ahmad Bahrul Hilmy" value={currentTeacher.name || ''} onChange={e => setCurrentTeacher({ ...currentTeacher, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Gelar (Opsional)</Label>
                <Input placeholder="e.g. S.Kom., M.Pd." value={currentTeacher.title || ''} onChange={e => setCurrentTeacher({ ...currentTeacher, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Kode Guru</Label>
                  <Input placeholder="e.g. 13" value={currentTeacher.code || ''} onChange={e => setCurrentTeacher({ ...currentTeacher, code: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Target JP Mengajar</Label>
                  <Input type="number" placeholder="e.g. 16" value={currentTeacher.target_jp || 0} onChange={e => setCurrentTeacher({ ...currentTeacher, target_jp: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Warna Identitas — <span className="font-mono text-primary">{currentTeacher.color}</span></Label>
                <div className="color-picker-row">
                  {pastelColors.map((color, i) => (
                    <div key={i} className={cn("color-option", currentTeacher.color === color && "selected")} style={{ backgroundColor: color }} onClick={() => setCurrentTeacher({ ...currentTeacher, color })} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTeacherModalOpen(false)}>Batal</Button>
              <Button onClick={handleSaveTeacher}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==========================================
           MODAL: CLASS FORM
           ========================================== */}
        <Dialog open={isClassModalOpen} onOpenChange={setIsClassModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isClassEdit ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nama Kelas</Label>
                <Input placeholder="e.g. VII-A, X-B" value={currentClass.name || ''} onChange={e => setCurrentClass({ ...currentClass, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tingkat (Level)</Label>
                <Select value={currentClass.level} onValueChange={v => setCurrentClass({ ...currentClass, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Wali Kelas</Label>
                <Select value={currentClass.homeroom_teacher_id || ''} onValueChange={v => setCurrentClass({ ...currentClass, homeroom_teacher_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Wali Kelas..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Tidak ada --</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}{t.title ? ` (${t.title})` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pendamping Wali Kelas</Label>
                <Select value={currentClass.co_homeroom_teacher_id || ''} onValueChange={v => setCurrentClass({ ...currentClass, co_homeroom_teacher_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Pendamping..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Tidak ada --</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}{t.title ? ` (${t.title})` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsClassModalOpen(false)}>Batal</Button>
              <Button onClick={handleSaveClass}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==========================================
           MODAL: SUBJECT FORM
           ========================================== */}
        <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isSubjectEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nama Lengkap Mata Pelajaran</Label>
                <Input placeholder="e.g. Dasar-Dasar Logika Pemrograman" value={currentSubject.name || ''} onChange={e => setCurrentSubject({ ...currentSubject, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Singkatan / Kode Grid</Label>
                <Input placeholder="e.g. DDLP" value={currentSubject.code || ''} onChange={e => setCurrentSubject({ ...currentSubject, code: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubjectModalOpen(false)}>Batal</Button>
              <Button onClick={handleSaveSubject}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==========================================
           MODAL: TEACHER CREDENTIALS (ADMIN ONLY)
           ========================================== */}
        <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Kelola Kredensial Login Guru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-muted p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Guru:</span> <strong>{credTeacher?.name}{credTeacher?.title ? `, ${credTeacher?.title}` : ''}</strong></p>
                <p><span className="text-muted-foreground">Kode:</span> <strong>{credTeacher?.code}</strong></p>
              </div>

              {credStatusMsg && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border">
                  {credStatusMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="cred-username">Username</Label>
                <Input
                  id="cred-username"
                  placeholder="e.g. ahmad_bahrul"
                  value={credUsername}
                  onChange={e => setCredUsername(e.target.value)}
                  disabled={credLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cred-password">Password Baru</Label>
                <Input
                  id="cred-password"
                  type="password"
                  placeholder="Masukkan password baru"
                  value={credPassword}
                  onChange={e => setCredPassword(e.target.value)}
                  disabled={credLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCredentialsModalOpen(false)} disabled={credLoading}>Batal</Button>
              <Button onClick={handleSaveCredentials} disabled={credLoading}>
                {credLoading ? 'Menyimpan...' : 'Simpan Kredensial'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==========================================
           MODAL: ADMIN FORM
           ========================================== */}
        <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isAdminEdit ? 'Edit Akun Admin' : 'Tambah Admin Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="admin-username">Username</Label>
                <Input
                  id="admin-username"
                  placeholder="Masukkan username"
                  value={currentAdmin.username || ''}
                  onChange={e => setCurrentAdmin({ ...currentAdmin, username: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">
                  {isAdminEdit ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder={isAdminEdit ? 'Masukkan password baru jika ingin mengubah' : 'Masukkan password'}
                  value={currentAdmin.password || ''}
                  onChange={e => setCurrentAdmin({ ...currentAdmin, password: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdminModalOpen(false)}>Batal</Button>
              <Button onClick={handleSaveAdmin}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==========================================
           MODAL: ACADEMIC YEAR FORM
           ========================================== */}
        <Dialog open={isAcademicYearModalOpen} onOpenChange={setIsAcademicYearModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isAcademicYearEdit ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="ay-year">Tahun Ajaran</Label>
                <Input
                  id="ay-year"
                  placeholder="e.g. 2025/2026"
                  value={currentAcademicYear.year || ''}
                  onChange={e => setCurrentAcademicYear({ ...currentAcademicYear, year: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ay-semester">Semester</Label>
                <Select
                  value={currentAcademicYear.semester || 'Ganjil'}
                  onValueChange={v => setCurrentAcademicYear({ ...currentAcademicYear, semester: v })}
                >
                  <SelectTrigger id="ay-semester">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ganjil">Ganjil</SelectItem>
                    <SelectItem value="Genap">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAcademicYearModalOpen(false)}>Batal</Button>
              <Button onClick={handleSaveAcademicYear}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==========================================
           BOTTOM NAVIGATION (MOBILE ONLY)
           ========================================== */}
        {isMobile && user && (
          <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 flex items-center justify-around no-print shadow-lg shadow-black/20 select-none shrink-0">
            {navItems.map(({ id, icon: Icon, label }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-all duration-200",
                    isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon size={18} className={cn("mb-1", isActive && "text-primary")} />
                  <span>{mobileLabels[id] || label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </TooltipProvider>
  );
}
