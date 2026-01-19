// Faculty Dashboard Logic
// Simulating logged-in user: Prof. Sharma (f1)
const CURRENT_FACULTY_ID = localStorage.getItem('user_id');

if (!CURRENT_FACULTY_ID || localStorage.getItem('user_role') !== 'faculty') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    loadFacultyStats();
    loadFacultyCourses();
    updateWelcomeMessage();

    // Listeners
    document.getElementById('co-form').addEventListener('submit', handleCOSubmit);
    document.getElementById('q-form').addEventListener('submit', handleQSubmit);
    document.getElementById('pwd-form').addEventListener('submit', handlePasswordChange);
});

let CURRENT_COURSE_ID = null;

function getFacultyData() {
    return db.faculty.find(f => f.id === CURRENT_FACULTY_ID);
}

function updateWelcomeMessage() {
    const faculty = getFacultyData();
    if (faculty) {
        document.getElementById('welcome-msg').innerText = `Welcome, ${faculty.title} ${faculty.name}`;

        // Load Profile Data
        const pName = document.getElementById('prof-name');
        if (pName) {
            pName.innerText = `${faculty.title} ${faculty.name}`;
            document.getElementById('prof-email').innerText = faculty.email;
            document.getElementById('prof-id').innerText = faculty.empId;
        }
    }
}

function loadFacultyStats() {
    const faculty = getFacultyData();
    if (!faculty) return;

    // 1. Mapped Courses
    const mappings = db.fc_mappings.filter(m => m.facultyId === CURRENT_FACULTY_ID && m.status === 'Active');
    document.getElementById('stat-courses').innerText = mappings.length;

    // 2. Questions Added (Mock Logic)
    // We need to count questions linked to courses assigned to this faculty
    // But questions table has 'courseId'.
    // If we assume faculty adds questions for their mapped courses...
    // Or we could add 'createdBy' to questions. For now, let's count questions for mapped courses.
    const courseIds = mappings.map(m => m.courseId);
    const questionCount = db.questions.filter(q => courseIds.includes(q.courseId)).length;
    document.getElementById('stat-questions').innerText = questionCount;

    // 3. COs (Mock Logic - COs not yet in DB, using placeholder or deriving from questions)
    // Let's assume 5 COs per course for now or 0 if no CO module yet.
    document.getElementById('stat-cos').innerText = mappings.length * 5;

    // 4. Academic Year (From first mapping or current)
    const ay = mappings.length > 0 ? mappings[0].academicYear : '2025-26';
    document.getElementById('stat-ay').innerText = ay;
}

function loadFacultyCourses() {
    const container = document.getElementById('faculty-courses-list');
    if (!container) return;

    const mappings = db.fc_mappings.filter(m => m.facultyId === CURRENT_FACULTY_ID && m.status === 'Active');

    if (mappings.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No courses assigned yet.</p>';
        return;
    }

    container.innerHTML = mappings.map(m => {
        const course = db.courses.find(c => c.id === m.courseId);
        if (!course) return '';

        // Resolve Program/Branch via Mapping
        const pbMap = db.pb_mappings.find(pm => pm.id === course.mappingId);
        let branchInfo = 'Unknown Branch';
        if (pbMap) {
            const prog = db.programs.find(p => p.id === pbMap.programId);
            const branch = db.branches.find(b => b.id === pbMap.branchId);
            if (prog && branch) branchInfo = `${prog.code} - ${branch.code}`;
        }

        return `
         <div class="course-card">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <h4 style="margin-bottom: 0.5rem; color: #fff;">${course.code}: ${course.name}</h4>
                <span class="badge" style="font-size: 0.7rem;">${course.type}</span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                ${branchInfo} • Year ${course.year} • Sem ${course.semester}
            </p>
            <div style="margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-muted);">
                <i class="fa-solid fa-calendar"></i> AY: ${m.academicYear}
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: auto;">
                <button class="btn btn-primary" style="font-size: 0.8rem; flex: 1;" onclick="viewCourse('${course.id}')">
                    <i class="fa-solid fa-eye"></i> View & Manage
                </button>
            </div>
        </div>
        `;
    }).join('');
}

/* --- Course Details Logic --- */
function viewCourse(courseId) {
    CURRENT_COURSE_ID = courseId;
    const course = db.courses.find(c => c.id === courseId);
    if (!course) return;

    // Set Header
    document.getElementById('cd-title').innerText = `${course.code}: ${course.name}`;
    document.getElementById('cd-subtitle').innerText = `${course.type} • Year ${course.year} • Sem ${course.semester}`;

    // Switch View
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.getElementById('course-details').classList.add('active');

    // Default to CO Tab
    switchCourseTab('cos');
}

function switchCourseTab(tabName) {
    document.querySelectorAll('.course-tab').forEach(el => el.style.display = 'none');
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    if (tabName === 'cos') loadCOs();
    if (tabName === 'questions') loadQuestions();
}

/* --- CO Management --- */
function loadCOs() {
    const tbody = document.getElementById('co-table-body');
    if (!tbody) return;

    const cos = (db.course_outcomes || []).filter(c => c.courseId === CURRENT_COURSE_ID && c.status === 'Active');

    tbody.innerHTML = cos.length ? cos.map(co => {
        const bloom = (db.blooms || []).find(b => b.id === co.bloomId);
        return `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 0.5rem; font-weight: bold; color: white;">${co.code}</td>
            <td>${co.description}</td>
            <td>${bloom ? bloom.name : '-'}</td>
            <td><span class="status-dot status-active"></span> Active</td>
            <td style="text-align: right;">
                 <button class="btn-icon delete" onclick="deleteCO('${co.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `;
    }).join('') : '<tr><td colspan="5" style="text-align: center; padding: 1rem;">No COs defined yet.</td></tr>';
}

function openCOModal() {
    document.getElementById('co-modal').style.display = 'flex';
    document.getElementById('co-form').reset();
    document.getElementById('co-id').value = '';

    // Populate Blooms
    const bloomSelect = document.getElementById('co-bloom');
    bloomSelect.innerHTML = '<option value="">Select Level...</option>' +
        (db.blooms || []).filter(b => b.status === 'Active').map(b => `<option value="${b.id}">${b.name}</option>`).join('');
}

function closeCOModal() {
    document.getElementById('co-modal').style.display = 'none';
}

async function handleCOSubmit(e) {
    e.preventDefault();
    if (!CURRENT_COURSE_ID) return;

    if (!db.course_outcomes) db.course_outcomes = [];

    const code = document.getElementById('co-code').value;
    const desc = document.getElementById('co-desc').value;
    const bloomId = document.getElementById('co-bloom').value;

    const newId = 'co' + Date.now(); // Simple ID
    const item = {
        id: newId,
        courseId: CURRENT_COURSE_ID,
        code,
        description: desc,
        bloomId,
        status: 'Active'
    };
    db.course_outcomes.push(item);
    await apiSave('course_outcomes', item);

    closeCOModal();
    loadCOs();
    loadFacultyStats(); // Update stats
}

async function deleteCO(id) {
    if (confirm('Delete this CO?')) {
        const idx = db.course_outcomes.findIndex(c => c.id === id);
        if (idx !== -1) {
            db.course_outcomes[idx].status = 'Inactive';
            await apiSave('course_outcomes', db.course_outcomes[idx]);
            loadCOs();
        }
    }
}

/* --- Question Bank Logic --- */
function loadQuestions() {
    const list = document.getElementById('qbank-list');
    if (!list) return;

    const qs = (db.questions || []).filter(q => q.courseId === CURRENT_COURSE_ID && q.status === 'Active');

    list.innerHTML = qs.length ? qs.map(q => {
        const bloom = (db.blooms || []).find(b => b.id === q.bloomId)?.name || '-';
        const diff = (db.difficulties || []).find(d => d.id === q.difficultyId)?.name || '-';
        const unit = (db.units || []).find(u => u.id === q.unitId)?.name || '-';

        return `
        <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-weight: 600; color: white;">${q.text}</span>
                 <button class="btn-icon delete" onclick="deleteQuestion('${q.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 1rem;">
                <span><i class="fa-solid fa-clipboard-check"></i> ${q.marks} Marks</span>
                <span><i class="fa-solid fa-brain"></i> ${bloom}</span>
                <span><i class="fa-solid fa-layer-group"></i> ${diff}</span>
                <span><i class="fa-solid fa-bookmark"></i> ${unit}</span>
                 <span><i class="fa-solid fa-bullseye"></i> ${q.co || '-'}</span>
            </div>
        </div>
        `;
    }).join('') : '<p style="text-align: center; color: var(--text-muted);">No questions added yet.</p>';
}

function openQuestionModal() {
    document.getElementById('q-modal').style.display = 'flex';
    document.getElementById('q-form').reset();

    // Populate Dropdowns
    const populate = (id, data, labelKey = 'name') => {
        document.getElementById(id).innerHTML = `<option value="">Select...</option>` +
            (data || []).filter(i => i.status === 'Active').map(i => `<option value="${i.id}">${i[labelKey]}</option>`).join('');
    };

    populate('q-bloom', db.blooms);
    populate('q-diff', db.difficulties);
    populate('q-unit', db.units);

    // CO Dropdown (Active COs for this course)
    const activeCOs = (db.course_outcomes || []).filter(c => c.courseId === CURRENT_COURSE_ID && c.status === 'Active');
    document.getElementById('q-co').innerHTML = `<option value="">Select CO...</option>` +
        activeCOs.map(c => `<option value="${c.code}">${c.code}</option>`).join('');
}

function closeQModal() {
    document.getElementById('q-modal').style.display = 'none';
}

async function handleQSubmit(e) {
    e.preventDefault();
    if (!CURRENT_COURSE_ID) return;

    if (!db.questions) db.questions = [];

    const text = document.getElementById('q-text').value;
    const marks = document.getElementById('q-marks').value;
    const unitId = document.getElementById('q-unit').value;
    const bloomId = document.getElementById('q-bloom').value;
    const difficultyId = document.getElementById('q-diff').value;
    const co = document.getElementById('q-co').value;

    const newId = 'q' + Date.now();
    const item = {
        id: newId,
        courseId: CURRENT_COURSE_ID,
        text,
        marks,
        unitId,
        bloomId,
        difficultyId,
        co,
        status: 'Active'
    };
    db.questions.push(item);
    await apiSave('questions', item);

    closeQModal();
    loadQuestions();
    loadFacultyStats();
}

async function deleteQuestion(id) {
    if (confirm('Delete this Question?')) {
        const idx = db.questions.findIndex(q => q.id === id);
        if (idx !== -1) {
            db.questions[idx].status = 'Inactive';
            await apiSave('questions', db.questions[idx]);
            loadQuestions();
        }
    }
}

/* --- Profile & Security Logic --- */
async function handlePasswordChange(e) {
    e.preventDefault();
    const oldP = document.getElementById('p-old').value;
    const newP = document.getElementById('p-new').value;
    const confP = document.getElementById('p-confirm').value;

    const faculty = getFacultyData();
    if (!faculty) return;

    // Verify Old Password (Mock Hash Check)
    // Note: In real app, oldP would be hashed before comparison.
    if (faculty.password !== oldP) {
        alert('Incorrect Current Password!');
        return;
    }

    if (newP !== confP) {
        alert('New Passwords do not match!');
        return;
    }

    if (newP.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
    }

    // Update Password
    faculty.password = newP;
    await apiSave('faculty', faculty);

    alert('Password Changed Successfully! Please re-login.');
    document.getElementById('pwd-form').reset();

    // Simulate Logout
    window.location.href = 'index.html';
}
