document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData(); // Load data from backend
    loadDashboardStats();
    renderCharts();
    checkSystemAlerts();
    loadRegulations();
    loadPrograms();
    loadBranches();
    loadMappings();

    // Init Object Filters and Data
    initCourseFilters();
    loadCourses(); // Fix: Load initial course list
    loadFaculty();
    loadFCMappings();
    loadAdminQuestions(); // Fix: Load QBank

    // Event Listeners
    document.getElementById('regulation-form').addEventListener('submit', handleRegulationSubmit);
    document.getElementById('program-form').addEventListener('submit', handleProgramSubmit);
    document.getElementById('branch-form').addEventListener('submit', handleBranchSubmit);
    document.getElementById('mapping-form').addEventListener('submit', handleMappingSubmit);
    document.getElementById('course-form').addEventListener('submit', handleCourseSubmit);
    document.getElementById('faculty-form').addEventListener('submit', handleFacultySubmit);
    document.getElementById('fc-form').addEventListener('submit', handleFCSubmit);

    // Plugins
    loadPlugins('bloom');
    loadPlugins('difficulty');
    loadPlugins('unit');
    document.getElementById('plugin-form').addEventListener('submit', handlePluginSubmit);
});

/* --- Regulation Management Logic --- */
function loadRegulations() {
    const tbody = document.getElementById('regulation-table-body');
    if (!tbody) return;

    tbody.innerHTML = (db.regulations || []).map(r => `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem; font-weight: 500; color: white;">${r.name}</td>
            <td>${r.academicYear}</td>
            <td><span class="status-dot ${r.status === 'Active' ? 'status-active' : 'status-inactive'}"></span> ${r.status}</td>
            <td style="text-align: right;">
                <button class="btn-icon" onclick="editRegulation('${r.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteRegulation('${r.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openRegulationModal(id = null) {
    const modal = document.getElementById('regulation-modal');
    const form = document.getElementById('regulation-form');
    const title = document.getElementById('reg-modal-title');

    modal.style.display = 'flex';
    if (id) {
        title.innerText = 'Edit Regulation';
        const r = db.regulations.find(x => x.id === id);
        document.getElementById('r-id').value = r.id;
        document.getElementById('r-name').value = r.name;
        document.getElementById('r-year').value = r.academicYear;
        document.getElementById('r-status').value = r.status;
    } else {
        title.innerText = 'Add Regulation';
        form.reset();
        document.getElementById('r-id').value = '';
    }
}

function closeRegulationModal() {
    document.getElementById('regulation-modal').style.display = 'none';
}

async function handleRegulationSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('r-id').value;
    const name = document.getElementById('r-name').value;
    const academicYear = document.getElementById('r-year').value;
    const status = document.getElementById('r-status').value;

    if (!db.regulations) db.regulations = [];

    let item;
    if (id) {
        const index = db.regulations.findIndex(r => r.id === id);
        if (index !== -1) {
            db.regulations[index] = { ...db.regulations[index], name, academicYear, status };
            item = db.regulations[index];
        }
    } else {
        const newId = 'r' + (db.regulations.length + 1);
        item = { id: newId, name, academicYear, status };
        db.regulations.push(item);
    }

    await apiSave('regulations', item);

    closeRegulationModal();
    loadRegulations();
}

function editRegulation(id) {
    openRegulationModal(id);
}

async function deleteRegulation(id) {
    if (confirm('Are you sure you want to deactivate this regulation?')) {
        const index = db.regulations.findIndex(r => r.id === id);
        if (index !== -1) {
            db.regulations[index].status = 'Inactive';
            await apiSave('regulations', db.regulations[index]);
            loadRegulations();
        }
    }
}

/* --- Program Management Logic --- */
function loadPrograms() {
    const tbody = document.getElementById('program-table-body');
    if (!tbody) return;

    tbody.innerHTML = db.programs.map(p => `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem; font-weight: 500; color: white;">${p.name}</td>
            <td><span class="badge badge-soft">${p.code}</span></td>
            <td>${p.duration} Years</td>
            <td><span class="status-dot ${p.status === 'Active' ? 'status-active' : 'status-inactive'}"></span> ${p.status}</td>
            <td style="text-align: right;">
                <button class="btn-icon" onclick="editProgram('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteProgram('${p.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openProgramModal(programId = null) {
    const modal = document.getElementById('program-modal');
    const form = document.getElementById('program-form');
    const title = document.getElementById('modal-title');

    modal.style.display = 'flex';
    if (programId) {
        title.innerText = 'Edit Program';
        const p = db.programs.find(x => x.id === programId);
        document.getElementById('p-id').value = p.id;
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-code').value = p.code;
        document.getElementById('p-duration').value = p.duration;
        document.getElementById('p-status').value = p.status;
    } else {
        title.innerText = 'Add New Program';
        form.reset();
        document.getElementById('p-id').value = '';
    }
}

function closeProgramModal() {
    document.getElementById('program-modal').style.display = 'none';
}

async function handleProgramSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    const name = document.getElementById('p-name').value;
    const code = document.getElementById('p-code').value;
    const duration = document.getElementById('p-duration').value;
    const status = document.getElementById('p-status').value;

    let item;
    if (id) {
        // Update
        const index = db.programs.findIndex(p => p.id === id);
        if (index !== -1) {
            db.programs[index] = { ...db.programs[index], name, code, duration, status };
            item = db.programs[index];
        }
    } else {
        // Create
        const newId = 'p' + (db.programs.length + 1);
        item = { id: newId, name, code, duration, status, regulationId: 'r1' }; // Added default r1 for safety if missing
        db.programs.push(item);
    }

    await apiSave('programs', item);

    closeProgramModal();
    loadPrograms();
    loadDashboardStats(); // Refresh stats
}

function editProgram(id) {
    openProgramModal(id);
}

async function deleteProgram(id) {
    if (confirm('Are you sure you want to deactivate this program?')) {
        const index = db.programs.findIndex(p => p.id === id);
        if (index !== -1) {
            db.programs[index].status = 'Inactive';
            await apiSave('programs', db.programs[index]);
            loadPrograms();
            loadDashboardStats();
        }
    }
}

/* --- Branch Management Logic (Master) --- */
function loadBranches() {
    const tbody = document.getElementById('branch-table-body');
    if (!tbody) return;

    tbody.innerHTML = db.branches.map(b => `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem; font-weight: 500; color: white;">${b.name}</td>
            <td><span class="badge badge-soft">${b.code}</span></td>
            <td><span class="status-dot ${b.status === 'Active' ? 'status-active' : 'status-inactive'}"></span> ${b.status}</td>
            <td style="text-align: right;">
                <button class="btn-icon" onclick="editBranch('${b.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteBranch('${b.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openBranchModal(branchId = null) {
    const modal = document.getElementById('branch-modal');
    const form = document.getElementById('branch-form');
    const title = document.getElementById('branch-modal-title');

    modal.style.display = 'flex';
    if (branchId) {
        title.innerText = 'Edit Master Branch';
        const b = db.branches.find(x => x.id === branchId);
        document.getElementById('b-id').value = b.id;
        document.getElementById('b-name').value = b.name;
        document.getElementById('b-code').value = b.code;
        document.getElementById('b-status').value = b.status;
    } else {
        title.innerText = 'Add Master Branch';
        form.reset();
        document.getElementById('b-id').value = '';
    }
}

function closeBranchModal() {
    document.getElementById('branch-modal').style.display = 'none';
}

async function handleBranchSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('b-id').value;
    const name = document.getElementById('b-name').value;
    const code = document.getElementById('b-code').value;
    const status = document.getElementById('b-status').value;

    let item;
    if (id) {
        const index = db.branches.findIndex(b => b.id === id);
        if (index !== -1) {
            db.branches[index] = { ...db.branches[index], name, code, status };
            item = db.branches[index];
        }
    } else {
        const newId = 'b' + (db.branches.length + 1);
        item = { id: newId, name, code, status };
        db.branches.push(item);
    }
    await apiSave('branches', item);

    closeBranchModal();
    loadBranches();
    loadDashboardStats(); // Refresh stats
}

function editBranch(id) {
    openBranchModal(id);
}

async function deleteBranch(id) {
    // Implementation remains same, strictly manages generic branch status
    if (confirm('Are you sure you want to deactivate this branch?')) {
        const index = db.branches.findIndex(b => b.id === id);
        if (index !== -1) {
            db.branches[index].status = 'Inactive';
            await apiSave('branches', db.branches[index]);
            loadBranches();
            loadDashboardStats();
        }
    }
}

/* --- Program-Branch Mapping Logic --- */
function loadMappings() {
    const tbody = document.getElementById('mapping-table-body');
    if (!tbody) return;

    tbody.innerHTML = (db.pb_mappings || []).map(m => {
        const program = db.programs.find(p => p.id === m.programId);
        const branch = db.branches.find(b => b.id === m.branchId);

        // Skip if referenced data is missing (integrity check)
        if (!program || !branch) return '';

        return `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem; font-weight: 500; color: white;">${program.name} (${program.code})</td>
            <td>${branch.name} (${branch.code})</td>
            <td><span class="status-dot ${m.status === 'Active' ? 'status-active' : 'status-inactive'}"></span> ${m.status}</td>
            <td style="text-align: right;">
                <button class="btn-icon delete" onclick="deleteMapping('${m.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `;
    }).join('');
}

function openMappingModal() {
    const modal = document.getElementById('mapping-modal');
    const programSelect = document.getElementById('m-program');
    const branchSelect = document.getElementById('m-branch');

    // Populate Active Programs
    programSelect.innerHTML = db.programs
        .filter(p => p.status === 'Active')
        .map(p => `<option value="${p.id}">${p.name} (${p.code})</option>`)
        .join('');

    // Populate Active Branches
    branchSelect.innerHTML = db.branches
        .filter(b => b.status === 'Active')
        .map(b => `<option value="${b.id}">${b.name} (${b.code})</option>`)
        .join('');

    modal.style.display = 'flex';
    document.getElementById('mapping-form').reset();
}

function closeMappingModal() {
    document.getElementById('mapping-modal').style.display = 'none';
}

async function handleMappingSubmit(e) {
    e.preventDefault();
    const programId = document.getElementById('m-program').value;
    const branchId = document.getElementById('m-branch').value;
    const status = document.getElementById('m-status').value;

    if (!db.pb_mappings) db.pb_mappings = [];

    // Check for existing mapping
    const exists = db.pb_mappings.some(m => m.programId === programId && m.branchId === branchId);
    if (exists) {
        alert('This mapping already exists!');
        return;
    }

    const newId = 'm' + (db.pb_mappings.length + 1);
    const item = { id: newId, programId, branchId, status };
    db.pb_mappings.push(item);

    await apiSave('pb_mappings', item);

    closeMappingModal();
    loadMappings();
}

async function deleteMapping(id) {
    if (confirm('Are you sure you want to deactivate this mapping?')) {
        const index = db.pb_mappings.findIndex(m => m.id === id);
        if (index !== -1) {
            db.pb_mappings[index].status = 'Inactive';
            await apiSave('pb_mappings', db.pb_mappings[index]);
            loadMappings();
        }
    }
}

/* --- Course Management Logic --- */
function initCourseFilters() {
    const regSelect = document.getElementById('course-filter-reg');
    if (!db.regulations) return;

    // reset
    regSelect.innerHTML = '<option value="">Select Regulation...</option>';
    db.regulations.forEach(r => {
        if (r.status === 'Active') {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.innerText = r.name;
            regSelect.appendChild(opt);
        }
    });
}

function filterCoursesByReg() {
    const regId = document.getElementById('course-filter-reg').value;
    const progSelect = document.getElementById('course-filter-prog');
    const branchSelect = document.getElementById('course-filter-branch');

    // Reset subs
    progSelect.innerHTML = '<option value="">Select Program...</option>';
    progSelect.disabled = true;
    branchSelect.innerHTML = '<option value="">Select Branch...</option>';
    branchSelect.disabled = true;
    loadCourses(); // Reload list (filtered only by reg)

    if (!regId) return;

    // Populate Active Programs
    if (db.programs) {
        db.programs.forEach(p => {
            if (p.status === 'Active') {
                // Check if this program has any mappings? Optional but good for UX
                const hasMappings = db.pb_mappings.some(m => m.programId === p.id && m.status === 'Active');
                if (hasMappings) {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.innerText = `${p.name} (${p.code})`;
                    progSelect.appendChild(opt);
                }
            }
        });
        progSelect.disabled = false;
    }
}

function filterCoursesByProg() {
    const progId = document.getElementById('course-filter-prog').value;
    const branchSelect = document.getElementById('course-filter-branch');

    // Reset sub
    branchSelect.innerHTML = '<option value="">Select Branch...</option>';
    branchSelect.disabled = true;
    loadCourses();

    if (!progId) return;

    // Populate Branches based on Active P-B Mappings
    const validMappings = db.pb_mappings.filter(m => m.programId === progId && m.status === 'Active');

    validMappings.forEach(m => {
        const branch = db.branches.find(b => b.id === m.branchId);
        if (branch && branch.status === 'Active') {
            const opt = document.createElement('option');
            opt.value = branch.id;
            opt.innerText = `${branch.name} (${branch.code})`;
            branchSelect.appendChild(opt);
        }
    });
    branchSelect.disabled = false;
}

function resetCourseFilters() {
    document.getElementById('course-filter-reg').value = '';
    filterCoursesByReg(); // triggers cascade reset
}

function loadCourses() {
    const tbody = document.getElementById('course-table-body');
    const filterReg = document.getElementById('course-filter-reg').value;
    const filterProg = document.getElementById('course-filter-prog').value;
    const filterBranch = document.getElementById('course-filter-branch').value;

    if (!tbody) return;

    let courses = db.courses || [];

    // Filter by Regulation
    if (filterReg) {
        courses = courses.filter(c => c.regulationId === filterReg);
    }

    // Filter by Program & Branch (Requires resolving Mapping ID)
    if (filterProg) {
        // Find all mappings for this program
        const mappings = db.pb_mappings.filter(m => m.programId === filterProg).map(m => m.id);
        courses = courses.filter(c => mappings.includes(c.mappingId));
    }

    if (filterBranch) {
        // Find specific mapping for this Prog + Branch
        const specificMapping = db.pb_mappings.find(m => m.programId === filterProg && m.branchId === filterBranch);
        if (specificMapping) {
            courses = courses.filter(c => c.mappingId === specificMapping.id);
        } else {
            courses = []; // Should not happen if UI is consistent
        }
    }

    if (courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="padding: 1rem; text-align: center; color: var(--text-muted);">No courses found for this selection.</td></tr>';
        return;
    }

    tbody.innerHTML = courses.map(c => {
        const reg = db.regulations.find(r => r.id === c.regulationId);
        const mapping = db.pb_mappings.find(m => m.id === c.mappingId);
        let mapName = 'N/A';

        if (mapping) {
            const prog = db.programs.find(p => p.id === mapping.programId);
            const branch = db.branches.find(b => b.id === mapping.branchId);
            if (prog && branch) mapName = `${prog.code} - ${branch.code}`;
        }

        return `
        <tr style="border-bottom: 1px solid var(--border);">
            <td><span class="badge badge-soft">${c.code}</span></td>
            <td style="padding: 1rem; font-weight: 500; color: white;">${c.name}</td>
            <td>${mapName}</td>
            <td>${reg ? reg.name : '-'}</td>
            <td>${c.year} - ${c.semester}</td>
            <td>${c.type}</td>
            <td><span class="status-dot ${c.status === 'Active' ? 'status-active' : 'status-inactive'}"></span> ${c.status}</td>
            <td style="text-align: right;">
                <button class="btn-icon delete" onclick="deleteCourse('${c.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `;
    }).join('');
}

function openCourseModal(id = null) {
    const modal = document.getElementById('course-modal');
    const filterReg = document.getElementById('course-filter-reg').value;
    const filterProg = document.getElementById('course-filter-prog').value;
    const filterBranch = document.getElementById('course-filter-branch').value;

    const regSelect = document.getElementById('c-reg');
    const mapSelect = document.getElementById('c-mapping');

    // Populate Regulations
    regSelect.innerHTML = db.regulations
        .filter(r => r.status === 'Active')
        .map(r => `<option value="${r.id}">${r.name}</option>`)
        .join('');

    // Pre-select if filtered
    if (filterReg) regSelect.value = filterReg;

    // Populate Mappings
    mapSelect.innerHTML = db.pb_mappings
        .filter(m => m.status === 'Active')
        .map(m => {
            const p = db.programs.find(x => x.id === m.programId);
            const b = db.branches.find(x => x.id === m.branchId);
            return `<option value="${m.id}">${p.code} - ${b.code}</option>`;
        })
        .join('');

    // Pre-select if Branch filtered
    if (filterProg && filterBranch) {
        const m = db.pb_mappings.find(m => m.programId === filterProg && m.branchId === filterBranch && m.status === 'Active');
        if (m) mapSelect.value = m.id;
    }

    modal.style.display = 'flex';
    document.getElementById('course-form').reset();
    document.getElementById('c-id').value = '';

    // Restore selections to match filters/logic
    if (filterReg) document.getElementById('c-reg').value = filterReg;
    if (filterProg && filterBranch) {
        const m = db.pb_mappings.find(m => m.programId === filterProg && m.branchId === filterBranch && m.status === 'Active');
        if (m) document.getElementById('c-mapping').value = m.id;
    }
}

function closeCourseModal() {
    document.getElementById('course-modal').style.display = 'none';
}

async function handleCourseSubmit(e) {
    e.preventDefault();
    const mappingId = document.getElementById('c-mapping').value;
    const regulationId = document.getElementById('c-reg').value;
    const name = document.getElementById('c-name').value;
    const code = document.getElementById('c-code').value;
    const year = document.getElementById('c-year').value;
    const semester = document.getElementById('c-sem').value;
    const credits = document.getElementById('c-credits').value;
    const type = document.getElementById('c-type').value;
    const category = document.getElementById('c-cat').value;
    const status = document.getElementById('c-status').value;

    if (!db.courses) db.courses = [];

    // Check dupe code
    const exists = db.courses.some(c => c.code === code && c.status !== 'Inactive'); // Simple check

    const newCourse = {
        id: 'c' + (db.courses.length + 1),
        code, name, mappingId, regulationId, year, semester, credits, type, category, status, facultyId: null
    };

    db.courses.push(newCourse);
    await apiSave('courses', newCourse);

    // Update Dashboard Stats for Active Courses
    loadDashboardStats();

    closeCourseModal();
    loadCourses();
}

async function deleteCourse(id) {
    if (confirm('Are you sure you want to deactivate this course?')) {
        const index = db.courses.findIndex(c => c.id === id);
        if (index !== -1) {
            db.courses[index].status = 'Inactive';
            await apiSave('courses', db.courses[index]);
            loadCourses();
            loadDashboardStats();
        }
    }
}

/* --- Faculty Management Logic --- */
function loadFaculty() {
    const tbody = document.getElementById('faculty-table-body');
    if (!tbody) return;

    tbody.innerHTML = db.faculty.map(f => {
        const branch = db.branches.find(b => b.id === f.branchId);

        return `
        <tr style="border-bottom: 1px solid var(--border);">
            <td><span class="badge badge-soft">${f.empId}</span></td>
            <td style="padding: 1rem; font-weight: 500; color: white;">${f.title} ${f.name}</td>
            <td>${branch ? branch.code : 'N/A'}</td>
            <td>
                <div>${f.email}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${f.phone || '-'}</div>
            </td>
            <td><span class="badge">${f.type}</span></td>
            <td><span class="status-dot ${f.status === 'Active' ? 'status-active' : 'status-inactive'}"></span> ${f.status}</td>
            <td style="text-align: right;">
                <button class="btn-icon delete" onclick="deleteFaculty('${f.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `;
    }).join('');
}

function openFacultyModal() {
    const modal = document.getElementById('faculty-modal');
    const branchSelect = document.getElementById('f-branch');

    // Populate Active Branches
    branchSelect.innerHTML = db.branches
        .filter(b => b.status === 'Active')
        .map(b => `<option value="${b.id}">${b.name} (${b.code})</option>`)
        .join('');

    modal.style.display = 'flex';
    document.getElementById('faculty-form').reset();
    document.getElementById('f-id').value = '';
}

function closeFacultyModal() {
    document.getElementById('faculty-modal').style.display = 'none';
}

function openBulkFacultyModal() {
    document.getElementById('bulk-modal').style.display = 'flex';
    document.getElementById('bulk-data').value = '';
}

function closeBulkFacultyModal() {
    document.getElementById('bulk-modal').style.display = 'none';
}

function generatePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pass = "";
    for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

async function handleFacultySubmit(e) {
    e.preventDefault();
    const id = document.getElementById('f-id').value;
    const title = document.getElementById('f-title').value;
    const name = document.getElementById('f-name').value;
    const empId = document.getElementById('f-empid').value;
    const branchId = document.getElementById('f-branch').value;
    const email = document.getElementById('f-email').value;
    const phone = document.getElementById('f-phone').value;
    const type = document.getElementById('f-type').value;
    const status = document.getElementById('f-status').value;

    if (!db.faculty) db.faculty = [];

    // Duplicate Check
    const exists = db.faculty.some(f => (f.empId === empId || f.email === email) && f.id !== id);
    if (exists) {
        alert('Faculty with this Emp ID or Email already exists!');
        return;
    }

    let item;
    if (id) {
        // Update
        // Note: Password update usually separate flow, ignoring for now
        // But we need to define 'item' for apiSave if we support update here?
        // The original code left this empty comment. Let's assume ID exists if we are here.
        // Wait, the original code had an empty if block?
        // "if (id) { // Update }" - yes, it seems it didn't implement update logic fully or relied on something else?
        // Ah, looking at the code, it seems it handles Update if ID is present.
        // BUT the original code only had comments! "Note: Password update..."
        // So update was NOT implemented in original code?
        // Wait, line 681: "if (id) { // Update ... }" - it seems it does NOTHING.
        // I should probably fix that or leave it alone.
        // If I leave it alone, I can't apiSave.
        // I will implement basic update.
        const index = db.faculty.findIndex(f => f.id === id);
        if (index !== -1) {
            db.faculty[index] = { ...db.faculty[index], title, name, empId, branchId, email, phone, type, status };
            item = db.faculty[index];
        }
    } else {
        // Create
        const newId = 'f' + (db.faculty.length + 1);
        const password = generatePassword();
        item = {
            id: newId, empId, title, name, email, phone, branchId, type, status, password
        };
        db.faculty.push(item);
        alert(`Faculty Created!\nSystem Generated Password: ${item.password}\n(In prod, this is emailed)`);
    }

    if (item) await apiSave('faculty', item);

    closeFacultyModal();
    loadFaculty();
    loadDashboardStats();
}

async function handleBulkUpload() {
    const data = document.getElementById('bulk-data').value;
    if (!data.trim()) return;

    const lines = data.split('\n');
    let successCount = 0;

    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 5) {
            const name = parts[0].trim();
            const email = parts[1].trim();
            const phone = parts[2].trim();
            const branchCode = parts[3].trim();
            const empId = parts[4].trim();

            // Find Branch ID by Code
            const branch = db.branches.find(b => b.code === branchCode && b.status === 'Active');
            if (branch && !db.faculty.some(f => f.empId === empId)) {
                const newId = 'f' + (db.faculty.length + 1);
                const password = generatePassword();
                const newItem = {
                    id: newId,
                    empId,
                    title: 'Prof.', // Default
                    name,
                    email,
                    phone,
                    branchId: branch.id,
                    type: 'Faculty',
                    status: 'Active',
                    password
                };
                db.faculty.push(newItem);
                await apiSave('faculty', newItem);
                successCount++;
            }
        }
    }

    closeBulkFacultyModal();
    loadFaculty();
    loadDashboardStats();
    alert(`Successfully imported ${successCount} faculty members.`);
}

async function deleteFaculty(id) {
    if (confirm('Are you sure you want to deactivate this faculty member?')) {
        const index = db.faculty.findIndex(f => f.id === id);
        if (index !== -1) {
            db.faculty[index].status = 'Inactive';
            await apiSave('faculty', db.faculty[index]);
            loadFaculty();
            loadDashboardStats();
        }
    }
}

/* --- Faculty-Course Mapping Logic --- */
function getAcademicYear() {
    const d = new Date();
    const month = d.getMonth() + 1; // 1-12
    const year = d.getFullYear();
    // If month is before June (1-5), current AY is (year-1)-year.
    // If month is June or later (6-12), current AY is year-(year+1).
    if (month < 6) {
        return `${year - 1}-${year.toString().slice(-2)}`;
    } else {
        return `${year}-${(year + 1).toString().slice(-2)}`;
    }
}

function loadFCMappings() {
    const tbody = document.getElementById('fc-table-body');
    if (!tbody) return;

    tbody.innerHTML = (db.fc_mappings || []).map(m => {
        const faculty = db.faculty.find(f => f.id === m.facultyId);
        const course = db.courses.find(c => c.id === m.courseId);

        if (!faculty || !course) return '';

        return `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem; font-weight: 500; color: white;">${faculty.title} ${faculty.name}</td>
            <td>${course.code} - ${course.name}</td>
            <td>${course.type}</td>
            <td>${course.year} - ${course.semester}</td>
            <td>${m.academicYear}</td>
            <td><span class="status-dot ${m.status === 'Active' ? 'status-active' : 'status-inactive'}"></span> ${m.status}</td>
            <td style="text-align: right;">
                <button class="btn-icon delete" onclick="deleteFCMapping('${m.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `;
    }).join('');
}

function openFCModal() {
    const modal = document.getElementById('fc-modal');
    const facultySelect = document.getElementById('fc-faculty');
    const courseSelect = document.getElementById('fc-course');
    const acInput = document.getElementById('fc-acyear');

    // Auto Set AY
    acInput.value = getAcademicYear();

    // Reset Course Select
    courseSelect.innerHTML = '<option value="">Select Type First...</option>';
    courseSelect.disabled = true;
    document.getElementById('fc-type').value = '';

    // Populate Active Faculty
    facultySelect.innerHTML = db.faculty
        .filter(f => f.status === 'Active')
        .map(f => `<option value="${f.id}">${f.title} ${f.name} (${f.empId})</option>`)
        .join('');

    modal.style.display = 'flex';
    document.getElementById('fc-form').reset();
    document.getElementById('fc-acyear').value = getAcademicYear(); // Re-set after reset
}

function closeFCModal() {
    document.getElementById('fc-modal').style.display = 'none';
}

function filterCoursesByType() {
    const type = document.getElementById('fc-type').value;
    const courseSelect = document.getElementById('fc-course');

    courseSelect.innerHTML = '<option value="">Select Course...</option>';
    if (!type) {
        courseSelect.disabled = true;
        return;
    }

    const courses = db.courses.filter(c => c.status === 'Active' && c.type === type);
    courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = `${c.code} - ${c.name} (${c.year}-${c.semester})`;
        courseSelect.appendChild(opt);
    });
    courseSelect.disabled = false;
}

async function handleFCSubmit(e) {
    e.preventDefault();
    const facultyId = document.getElementById('fc-faculty').value;
    const courseId = document.getElementById('fc-course').value;
    const academicYear = document.getElementById('fc-acyear').value;
    const status = document.getElementById('fc-status').value;

    if (!db.fc_mappings) db.fc_mappings = [];

    // Duplicate Check
    const exists = db.fc_mappings.some(m => m.facultyId === facultyId && m.courseId === courseId && m.academicYear === academicYear && m.status === 'Active');

    if (exists) {
        alert('This faculty is already assigned to this course for this Academic Year.');
        return;
    }

    const newId = 'fc' + (db.fc_mappings.length + 1);
    const item = { id: newId, facultyId, courseId, academicYear, status };
    db.fc_mappings.push(item);
    await apiSave('fc_mappings', item);

    closeFCModal();
    loadFCMappings();
}

async function deleteFCMapping(id) {
    if (confirm('Are you sure you want to deactivate this mapping?')) {
        const index = db.fc_mappings.findIndex(m => m.id === id);
        if (index !== -1) {
            db.fc_mappings[index].status = 'Inactive';
            await apiSave('fc_mappings', db.fc_mappings[index]);
            loadFCMappings();
        }
    }
}

/* --- Course Plugins (Masters) Logic --- */
function loadPlugins(type) {
    let data = [];
    let tbodyIds = {
        'bloom': 'bloom-table-body',
        'difficulty': 'difficulty-table-body',
        'unit': 'unit-table-body'
    };

    if (type === 'bloom') data = db.blooms || [];
    if (type === 'difficulty') data = db.difficulties || [];
    if (type === 'unit') data = db.units || [];

    const tbody = document.getElementById(tbodyIds[type]);
    if (!tbody) return;

    tbody.innerHTML = data.map(item => `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 0.5rem;">${item.name}</td>
            <td><span class="status-dot ${item.status === 'Active' ? 'status-active' : 'status-inactive'}"></span></td>
            <td style="text-align: right;">
                <button class="btn-icon delete" onclick="deletePlugin('${type}', '${item.id}')" style="font-size: 0.8rem;"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openPluginModal(type) {
    const modal = document.getElementById('plugin-modal');
    const title = document.getElementById('plugin-modal-title');
    const typeInput = document.getElementById('pl-type');

    typeInput.value = type;
    title.innerText = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('plugin-form').reset();
    document.getElementById('pl-status').value = 'Active';
    document.getElementById('pl-type').value = type; // Ensure it's set after reset

    modal.style.display = 'flex';
}

function closePluginModal() {
    document.getElementById('plugin-modal').style.display = 'none';
}

async function handlePluginSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('pl-type').value;
    const name = document.getElementById('pl-name').value;
    const status = document.getElementById('pl-status').value;

    let arr = [];
    let tableName = '';
    if (type === 'bloom') { if (!db.blooms) db.blooms = []; arr = db.blooms; tableName = 'blooms'; }
    if (type === 'difficulty') { if (!db.difficulties) db.difficulties = []; arr = db.difficulties; tableName = 'difficulties'; }
    if (type === 'unit') { if (!db.units) db.units = []; arr = db.units; tableName = 'units'; }

    // Duplicate Check
    if (arr.some(i => i.name.toLowerCase() === name.toLowerCase())) {
        alert('Item already exists!');
        return;
    }

    const newId = type.charAt(0) + (arr.length + 1); // b1, d1, u1 basic logic
    const item = { id: newId, name, status };
    arr.push(item);

    await apiSave(tableName, item);

    closePluginModal();
    loadPlugins(type);
}

async function deletePlugin(type, id) {
    if (confirm('Deactivate this item?')) {
        let arr = [];
        let tableName = '';
        if (type === 'bloom') { arr = db.blooms; tableName = 'blooms'; }
        if (type === 'difficulty') { arr = db.difficulties; tableName = 'difficulties'; }
        if (type === 'unit') { arr = db.units; tableName = 'units'; }

        const item = arr.find(i => i.id === id);
        if (item) {
            item.status = 'Inactive';
            await apiSave(tableName, item);
            loadPlugins(type);
        }
    }
}

function loadDashboardStats() {
    // Ensure data is loaded
    if (!db.programs || !db.branches || !db.courses || !db.faculty) {
        console.warn('DB not fully loaded yet for stats');
        return;
    }

    // 1. Programs
    const totalPrograms = db.programs.length;
    const activePrograms = db.programs.filter(p => p.status === 'Active').length;
    updateStat('stat-programs', totalPrograms, 'stat-programs-sub', `${activePrograms} Active`);

    // 2. Branches (Master)
    const totalBranches = db.branches.length;
    const activeBranches = db.branches.filter(b => b.status === 'Active').length;
    updateStat('stat-branches', totalBranches, 'stat-branches-sub', `${activeBranches} Active`);

    // 3. Courses
    const activeCourses = db.courses.filter(c => c.status === 'Active').length;
    const totalCourses = db.courses.length;
    updateStat('stat-courses', activeCourses, 'stat-courses-sub', `Total: ${totalCourses}`);

    // 4. Faculty
    const totalFaculty = db.faculty.length;
    const activeFaculty = db.faculty.filter(f => f.status === 'Active').length;
    updateStat('stat-faculty', totalFaculty, 'stat-faculty-sub', `${activeFaculty} Active`);
}

function updateStat(mainId, mainValue, subId, subValue) {
    const mainEl = document.getElementById(mainId);
    const subEl = document.getElementById(subId);

    if (mainEl) animateValue(mainEl, 0, mainValue, 1000);
    if (subEl) subEl.innerText = subValue;
}

function renderCharts() {
    // Chart 1: Faculty per Branch (Pie Chart)
    const branchCounts = {};
    if (db.faculty) {
        db.faculty.forEach(f => {
            // Find branch name
            const branch = db.branches ? db.branches.find(b => b.id === f.branchId) : null;
            const branchName = branch ? branch.code : 'Unknown';
            branchCounts[branchName] = (branchCounts[branchName] || 0) + 1;
        });
    }

    const facultyCtx = document.getElementById('facultyChart').getContext('2d');
    // Destroy existing if any (optional but good practice, though simplest here is just new)
    new Chart(facultyCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(branchCounts),
            datasets: [{
                data: Object.values(branchCounts),
                backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8' } }
            }
        }
    });

    // Chart 2: Courses per Branch (Bar Chart)
    const courseCounts = {};
    if (db.courses) {
        db.courses.forEach(c => {
            // Resolve Branch via Mapping
            let branchName = 'Unmapped';
            if (c.mappingId && db.pb_mappings) {
                const mapping = db.pb_mappings.find(m => m.id === c.mappingId);
                if (mapping && mapping.branchId && db.branches) {
                    const branch = db.branches.find(b => b.id === mapping.branchId);
                    if (branch) branchName = branch.code;
                }
            }
            courseCounts[branchName] = (courseCounts[branchName] || 0) + 1;
        });
    }

    const coursesCtx = document.getElementById('coursesChart').getContext('2d');
    new Chart(coursesCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(courseCounts),
            datasets: [{
                label: 'Number of Courses',
                data: Object.values(courseCounts),
                backgroundColor: '#6366f1',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function checkSystemAlerts() {
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';
    const alerts = [];

    // Alert 1: Courses without Faculty
    const unassignedCourses = db.courses.filter(c => !c.facultyId);
    if (unassignedCourses.length > 0) {
        alerts.push({
            type: 'warning',
            msg: `${unassignedCourses.length} Courses have no faculty assigned`,
            details: unassignedCourses.map(c => c.code).join(', ')
        });
    }

    // Alert 2: Inactive Programs with Active Students (Mock logic)
    // For now showing inactive programs
    const inactivePrograms = db.programs.filter(p => p.status === 'Inactive');
    if (inactivePrograms.length > 0) {
        alerts.push({
            type: 'info',
            msg: `${inactivePrograms.length} Programs are marked Inactive`,
            details: inactivePrograms.map(p => p.code).join(', ')
        });
    }

    // Render Alerts
    alerts.forEach(alert => {
        const div = document.createElement('div');
        div.style.cssText = `
            padding: 1rem; 
            margin-bottom: 0.75rem; 
            background: rgba(255,255,255,0.05); 
            border-left: 4px solid ${alert.type === 'warning' ? '#f59e0b' : '#3b82f6'}; 
            border-radius: 4px;
        `;
        div.innerHTML = `
            <div style="font-weight:600; color:white;">${alert.msg}</div>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">${alert.details}</div>
        `;
        container.appendChild(div);
    });

    if (alerts.length === 0) {
        container.innerHTML = `<div style="color:var(--text-muted); text-align:center;">System Healthy. No alerts.</div>`;
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/* --- QP Generator Logic --- */
function initQP() {
    const progSelect = document.getElementById('qp-program');
    if (progSelect) {
        progSelect.innerHTML = '<option value="">Select Program...</option>' +
            db.programs.filter(p => p.status === 'Active').map(p => `<option value="${p.id}">${p.code} - ${p.name}</option>`).join('');
    }
}

function handleQPProgChange() {
    const progId = document.getElementById('qp-program').value;
    const courseSelect = document.getElementById('qp-course');

    courseSelect.innerHTML = '<option value="">Select Course...</option>';
    courseSelect.disabled = true;

    if (!progId) return;

    // Find all mappingIds for this program
    const mappingIds = db.pb_mappings.filter(m => m.programId === progId && m.status === 'Active').map(m => m.id);

    // Find courses linked to these mappingIds
    const courses = db.courses.filter(c => mappingIds.includes(c.mappingId) && c.status === 'Active');

    courseSelect.innerHTML += courses.map(c => `<option value="${c.id}">${c.code} - ${c.name} (${c.type})</option>`).join('');
    courseSelect.disabled = false;
}

function handleQPCourseChange() {
    const courseId = document.getElementById('qp-course').value;
    if (!courseId) return;

    const course = db.courses.find(c => c.id === courseId);
    if (course) {
        document.getElementById('qp-sem').innerText = `Year ${course.year} / Sem ${course.semester}`;
        document.getElementById('qp-ay').innerText = getAcademicYear();

        // Find Regulation via Course -> Mapping -> Program (or simplified if stored on course)
        // We added regulationId to course earlier? Yes.
        const reg = db.regulations.find(r => r.id === course.regulationId);
        document.getElementById('qp-reg').innerText = reg ? reg.name : '-';
    }
}

let blueprintRows = 0;
function addBlueprintRow() {
    blueprintRows++;
    const tbody = document.getElementById('bp-table-body');
    const tr = document.createElement('tr');
    tr.id = `bp-row-${blueprintRows}`;
    tr.style.cssText = "border-bottom: 1px solid var(--border);";

    tr.innerHTML = `
        <td style="padding: 0.5rem;"><input type="text" placeholder="e.g. Part A" class="glass-input" style="width: 100%;"></td>
        <td><input type="number" min="1" value="5" class="glass-input" style="width: 60px;"></td>
        <td><input type="number" min="1" value="2" class="glass-input" style="width: 60px;"></td>
        <td>
            <select class="glass-input">
                <option value="">Any</option>
                ${(db.blooms || []).filter(b => b.status === 'Active').map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
            </select>
        </td>
        <td>
             <select class="glass-input">
                <option value="">Any</option>
                ${(db.difficulties || []).filter(d => d.status === 'Active').map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
            </select>
        </td>
         <td>
             <select class="glass-input">
                <option value="">Any</option>
                ${(db.units || []).filter(u => u.status === 'Active').map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
        </td>
        <td style="text-align: right;">
            <button class="btn-icon delete" onclick="document.getElementById('bp-row-${blueprintRows}').remove()"><i class="fa-solid fa-trash"></i></button>
        </td>
    `;
    tbody.appendChild(tr);
}

function generateQP() {
    const courseId = document.getElementById('qp-course').value;
    if (!courseId) { alert('Please select a course first.'); return; }

    const examTitle = document.getElementById('qp-assessment').value;
    const date = document.getElementById('qp-date').value;
    const course = db.courses.find(c => c.id === courseId);
    const progId = document.getElementById('qp-program').value;
    const prog = db.programs.find(p => p.id === progId);

    // Validate Rows
    const rows = document.querySelectorAll('#bp-table-body tr');
    if (rows.length === 0) { alert('Please add at least one section to the blueprint.'); return; }

    let allQuestionsHTML = '';
    let totalMarks = 0;

    // Process each section
    for (let row of rows) {
        const inputs = row.querySelectorAll('input, select');
        const secName = inputs[0].value;
        const count = parseInt(inputs[1].value);
        const marks = parseInt(inputs[2].value);
        const bloomId = inputs[3].value;
        const diffId = inputs[4].value;
        const unitId = inputs[5].value;

        // Filter Questions
        let pool = db.questions.filter(q => q.courseId === courseId && q.status === 'Active');
        if (bloomId) pool = pool.filter(q => q.bloomId === bloomId);
        if (diffId) pool = pool.filter(q => q.difficultyId === diffId);
        if (unitId) pool = pool.filter(q => q.unitId === unitId);
        // Marks check? Maybe strict or loose. Let's ignore marks check for pool, but use marks for output.

        if (pool.length < count) {
            alert(`Not enough questions available for section "${secName}". Required: ${count}, Available: ${pool.length}`);
            return;
        }

        // Random Selection
        const shuffled = pool.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);

        // Render Section
        allQuestionsHTML += `<h4 style="margin: 20px 0 10px 0; border-bottom: 1px dashed black;">${secName} (${count} x ${marks} = ${count * marks} Marks)</h4>`;
        allQuestionsHTML += '<ol style="margin: 0; padding-left: 20px;">';
        selected.forEach(q => {
            allQuestionsHTML += `<li style="margin-bottom: 10px;">${q.text} <span style="float:right; font-weight:bold;">[${marks}M]</span></li>`;
        });
        allQuestionsHTML += '</ol>';

        totalMarks += count * marks;
    }

    // Populate Preview
    document.getElementById('p-dept').innerText = prog ? prog.code : 'Dept';
    document.getElementById('p-exam').innerText = examTitle;
    document.getElementById('p-course').innerText = `${course.code} - ${course.name}`;
    document.getElementById('p-max-marks').innerText = totalMarks;
    document.getElementById('p-date').innerText = date || new Date().toLocaleDateString();

    document.getElementById('p-questions').innerHTML = allQuestionsHTML;

    // Show Preview
    document.getElementById('qp-preview').style.display = 'block';

    // Scroll to Preview
    document.getElementById('qp-preview').scrollIntoView({ behavior: 'smooth' });
}

/* --- Admin QBank Logic --- */
function loadAdminQuestions() {
    const container = document.getElementById('admin-questions-list');
    if (!container) return;

    if (!db.questions || db.questions.length === 0) {
        container.innerHTML = '<div style="padding:1rem; text-align:center; color: var(--text-muted)">No questions found. Add via Faculty Access.</div>';
        return;
    }

    container.innerHTML = db.questions.filter(q => q.status === 'Active').map(q => {
        const course = db.courses.find(c => c.id === q.courseId);
        const bloom = (db.blooms || []).find(b => b.id === q.bloomId);
        const diff = (db.difficulties || []).find(d => d.id === q.difficultyId);

        const bloomBadge = bloom ? `<span style="font-size: 0.8rem; background: rgba(99, 102, 241, 0.2); padding: 0.2rem 0.5rem; border-radius: 4px; color: var(--primary);">${bloom.name}</span>` : '';

        return `
            <div class="glass-panel" style="margin-bottom: 0.5rem; padding: 1rem; display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-weight: 600; color: white; margin-bottom: 0.25rem;">${q.text}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">
                        ${course ? course.code : 'Unknown'} • Unit ${q.unitId || '-'} • ${q.marks} Marks
                    </div>
                </div>
                <div style="text-align: right;">
                    ${bloomBadge}
                    <div style="font-size: 0.8rem; margin-top: 0.25rem; color: var(--text-muted);">${diff ? diff.name : (q.difficulty || '-')}</div>
                </div>
            </div>
         `;
    }).join('');
}
