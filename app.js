/* ====================================================
   ResQLink — Disaster Relief Task Coordination Portal
   app.js  |  Phase 1: Frontend (jQuery)
==================================================== */

// ════════════════════════════════════════════════
// DATA — JavaScript Arrays (source of truth)
// ════════════════════════════════════════════════

let tasks = [
  {
    id: 1,
    title: "Medical Supply Distribution",
    description: "Coordinate delivery of medical kits to Zone A shelters. Minimum 3 volunteers required.",
    priority: "critical",
    status: "pending",
    minVolunteers: 3,
    requiredSkills: ["First Aid", "Logistics"],
    assignedVolunteers: []
  },
  {
    id: 2,
    title: "Shelter Infrastructure Zone B",
    description: "Set up temporary shelters for 200 displaced families in Zone B. Engineering skills needed.",
    priority: "high",
    status: "active",
    minVolunteers: 4,
    requiredSkills: ["Engineering", "Logistics"],
    assignedVolunteers: ["Ahmad K.", "Sara M.", "Bilal R."]
  },
  {
    id: 3,
    title: "Water Purification Unit Ops",
    description: "Operate purification stations at locations W1, W2, W3. Daily volunteer rotation schedule.",
    priority: "medium",
    status: "completed",
    minVolunteers: 2,
    requiredSkills: ["Medical", "Engineering"],
    assignedVolunteers: ["Ahmad K.", "Sara M.", "Bilal R.", "Noor J.", "Zaid F."]
  }
];

let volunteers = [
  { id: 1, name: "Ahmad K.", email: "ahmad@relief.org", skills: ["First Aid", "Logistics"],        availability: "available" },
  { id: 2, name: "Sara M.",  email: "sara@relief.org",  skills: ["Medical", "Search & Rescue"],    availability: "on_task"  },
  { id: 3, name: "Bilal R.", email: "bilal@relief.org", skills: ["Engineering", "Logistics"],       availability: "available" }
];

let nextTaskId = 4;
let nextVolId  = 4;

let activePriorityFilter = "all";
let searchQuery = "";

const STATUS_CYCLE = ["pending", "active", "completed"];

// ════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════

function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name) {
  const palette = ["#4f6ef7", "#e11d48", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return palette[h % palette.length];
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return $("<div>").text(str).html();
}

// ════════════════════════════════════════════════
// STATS — annotations 7, 12
// ════════════════════════════════════════════════

function updateStats() {
  const active    = tasks.filter(t => t.status === "active").length;
  const critical  = tasks.filter(t => t.priority === "critical").length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const totalVols = volunteers.length;

  $("#stat-active").text(active);
  $("#stat-critical").text(critical);
  $("#stat-completed").text(completed);
  $("#stat-volunteers").text(totalVols);
  $("#stat-vol-badge").text(totalVols);   // annotation 7
}

// ════════════════════════════════════════════════
// TASK CARD BUILDER
// ════════════════════════════════════════════════

function buildTaskCard(task) {
  const assignCount = task.assignedVolunteers.length;
  const isCompleted = task.status === "completed";

  return $(`
    <div class="task-card priority-${task.priority}" data-id="${task.id}">
      <div class="card-header">
        <span class="priority-badge badge-${task.priority}">${task.priority.toUpperCase()}</span>
        <span class="card-title">${escapeHtml(task.title)}</span>
        <button class="card-delete" data-id="${task.id}" aria-label="Delete task" title="Delete task">✕</button>
      </div>
      <p class="card-desc">${escapeHtml(task.description)}</p>
      <div class="card-footer">
        <button class="status-btn status-${task.status}" data-id="${task.id}">${task.status.toUpperCase()}</button>
        <span class="assigned-count" id="assigned-count-${task.id}">${assignCount} assigned</span>
        <div class="assign-wrapper">
          <button class="assign-btn${isCompleted ? " disabled" : ""}" data-id="${task.id}">+ Assign</button>
          <div class="assign-dropdown" id="assign-dropdown-${task.id}"></div>
        </div>
      </div>
    </div>
  `);
}

// ════════════════════════════════════════════════
// RENDER TASK GRID  (annotations 5, 6, 12)
// ════════════════════════════════════════════════

function renderTasks() {
  const $grid = $("#task-grid");
  $grid.empty();

  const visible = tasks.filter(t => {
    const matchPriority = activePriorityFilter === "all" || t.priority === activePriorityFilter;
    const matchSearch   = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPriority && matchSearch;
  });

  if (visible.length === 0) {
    $grid.html(`<div class="empty-state"><p>No tasks match your filters.</p></div>`);
    return;
  }

  visible.forEach(task => $grid.append(buildTaskCard(task)));
}

// ════════════════════════════════════════════════
// VOLUNTEER SIDEBAR BUILDER
// ════════════════════════════════════════════════

function buildVolCard(vol) {
  const color = avatarColor(vol.name);
  const label = vol.availability === "available" ? "Available" : "On Task";
  return $(`
    <div class="vol-card" data-vol-id="${vol.id}">
      <div class="vol-avatar" style="background:${color}">${getInitials(vol.name)}</div>
      <div class="vol-info">
        <div class="vol-name">${escapeHtml(vol.name)}</div>
        <div class="vol-skills">${vol.skills.join(" · ")}</div>
        <span class="avail-badge avail-${vol.availability}">${label}</span>
      </div>
    </div>
  `);
}

function renderVolunteers() {
  const $list = $("#volunteer-list");
  $list.empty();
  volunteers.forEach(v => $list.append(buildVolCard(v)));
}

// ════════════════════════════════════════════════
// FOCUS TRAP — modal constraint
// ════════════════════════════════════════════════

function trapFocus($modal) {
  const sel = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  $modal.off("keydown.focustrap").on("keydown.focustrap", function (e) {
    if (e.key !== "Tab") return;
    const $focusable = $modal.find(sel).filter(":visible");
    if ($focusable.length === 0) return;
    const first = $focusable.first()[0];
    const last  = $focusable.last()[0];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });
}

// ════════════════════════════════════════════════
// ANNOTATION 1 — FAB → Create Task modal
// ════════════════════════════════════════════════

function openTaskModal() {
  resetTaskForm();
  $("#modal-backdrop").attr("aria-hidden", "false").addClass("open");
  setTimeout(() => $("#task-title").trigger("focus"), 30);
  trapFocus($("#create-task-modal"));
}

function closeTaskModal() {
  $("#modal-backdrop").removeClass("open").attr("aria-hidden", "true");
  $("#create-task-modal").off("keydown.focustrap");
}

// ════════════════════════════════════════════════
// ANNOTATION 3 — Register Volunteer modal
// ════════════════════════════════════════════════

function openVolModal() {
  resetVolForm();
  $("#vol-backdrop").attr("aria-hidden", "false").addClass("open");
  setTimeout(() => $("#vol-name").trigger("focus"), 30);
  trapFocus($("#vol-modal"));
}

function closeVolModal() {
  $("#vol-backdrop").removeClass("open").attr("aria-hidden", "true");
  $("#vol-modal").off("keydown.focustrap");
}

// ════════════════════════════════════════════════
// DOCUMENT READY — wire up all events
// ════════════════════════════════════════════════

$(function () {

  // ── Initial render ──────────────────────────
  renderTasks();
  renderVolunteers();
  updateStats();

  // ── Annotation 1: FAB ───────────────────────
  $("#fab-new-task").on("click", openTaskModal);
  $("#modal-close, #modal-cancel").on("click", closeTaskModal);
  $("#modal-backdrop").on("click", function (e) {
    if (e.target === this) closeTaskModal();
  });

  // ── Annotation 3: Register Volunteer ────────
  $("#register-btn").on("click", openVolModal);
  $("#vol-modal-close, #vol-cancel").on("click", closeVolModal);
  $("#vol-backdrop").on("click", function (e) {
    if (e.target === this) closeVolModal();
  });

  // Escape key closes any open modal
  $(document).on("keydown.modal", function (e) {
    if (e.key === "Escape") { closeTaskModal(); closeVolModal(); }
  });

  // ── Annotation 2: Status badge cycling ──────
  $("#task-grid").on("click", ".status-btn", function () {
    const id   = parseInt($(this).data("id"));
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const idx   = STATUS_CYCLE.indexOf(task.status);
    task.status = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]; // update array

    $(this)
      .removeClass("status-pending status-active status-completed")
      .addClass(`status-${task.status}`)
      .text(task.status.toUpperCase());

    const $assignBtn = $(this).closest(".task-card").find(".assign-btn");
    if (task.status === "completed") {
      $assignBtn.addClass("disabled");
    } else {
      $assignBtn.removeClass("disabled");
    }

    updateStats();
  });

  // ── Annotation 8: Delete with CSS transition ─
  $("#task-grid").on("click", ".card-delete", function () {
    const id    = parseInt($(this).data("id"));
    const $card = $(this).closest(".task-card");

    $card.addClass("removing");
    setTimeout(function () {
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) tasks.splice(idx, 1);
      $card.remove();
      updateStats();
    }, 310);
  });

  // ── Annotation 4: +Assign dropdown ──────────
  $("#task-grid").on("click", ".assign-btn", function (e) {
    e.stopPropagation();
    if ($(this).hasClass("disabled")) return;

    const id        = parseInt($(this).data("id"));
    const task      = tasks.find(t => t.id === id);
    const $dropdown = $(`#assign-dropdown-${id}`);

    // Close other open dropdowns
    $(".assign-dropdown.open").not($dropdown).removeClass("open");

    if ($dropdown.hasClass("open")) {
      $dropdown.removeClass("open");
      return;
    }

    const eligible = volunteers.filter(v =>
      v.availability === "available" && !task.assignedVolunteers.includes(v.name)
    );

    $dropdown.html(
      eligible.length === 0
        ? `<div class="assign-option-empty">No available volunteers</div>`
        : eligible.map(v =>
            `<div class="assign-option" data-task-id="${id}" data-vol-id="${v.id}">${escapeHtml(v.name)}</div>`
          ).join("")
    ).addClass("open");
  });

  // Selecting a volunteer from dropdown
  $("#task-grid").on("click", ".assign-option", function () {
    const taskId = parseInt($(this).data("task-id"));
    const volId  = parseInt($(this).data("vol-id"));
    const task   = tasks.find(t => t.id === taskId);
    const vol    = volunteers.find(v => v.id === volId);
    if (!task || !vol) return;

    task.assignedVolunteers.push(vol.name);
    vol.availability = "on_task"; // update volunteers array

    $(`#assigned-count-${taskId}`).text(`${task.assignedVolunteers.length} assigned`);
    $(`#assign-dropdown-${taskId}`).removeClass("open");

    renderVolunteers(); // reflect new availability in sidebar
  });

  // Close dropdown on outside click
  $(document).on("click.assigndrop", function (e) {
    if (!$(e.target).closest(".assign-wrapper").length) {
      $(".assign-dropdown.open").removeClass("open");
    }
  });

  // ── Annotation 5: Priority filter pills ─────
  $(".pill").on("click", function () {
    activePriorityFilter = $(this).data("priority");
    $(".pill").removeClass("active");
    $(this).addClass("active");
    renderTasks();
  });

  // ── Annotation 6: Search input ───────────────
  $("#search-input").on("input", function () {
    searchQuery = $(this).val();
    renderTasks();
  });

  // ── Annotation 9: Title field live validation ─
  $("#task-title").on("input", function () {
    if ($(this).val().trim().length >= 5) {
      $("#title-error").text("");
      $(this).removeClass("error");
    }
  });

  // ── Annotation 11: Description char counter ──
  $("#task-desc").on("input", function () {
    let val = $(this).val();
    if (val.length > 200) {
      val = val.slice(0, 200);
      $(this).val(val);
    }
    const len = val.length;
    $("#char-counter").text(`${len} / 200`).toggleClass("over", len >= 200);

    if (val.trim().length > 0) {
      $("#desc-error").text("");
      $(this).removeClass("error");
    }
  });

  // ── Annotation 12: Create Task ───────────────
  $("#create-task-btn").on("click", function () {
    const title    = $("#task-title").val().trim();
    const desc     = $("#task-desc").val().trim();
    const priority = $("#task-priority").val();
    const minVol   = parseInt($("#task-min-vol").val()) || 1;
    const skills   = $("input[name='skill']:checked").map(function () { return $(this).val(); }).get();

    let valid = true;

    // annotation 9 — title must be >= 5 chars
    if (title.length < 5) {
      $("#title-error").text("Title must be at least 5 characters");
      $("#task-title").addClass("error");
      valid = false;
    }

    // annotation 11 — description required
    if (desc.length === 0) {
      $("#desc-error").text("Description is required");
      $("#task-desc").addClass("error");
      valid = false;
    }

    if (!valid) return;

    const newTask = {
      id: nextTaskId++,
      title,
      description: desc,
      priority,
      status: "pending",
      minVolunteers: minVol,
      requiredSkills: skills,
      assignedVolunteers: []
    };

    tasks.unshift(newTask); // prepend to array

    const $grid = $("#task-grid");
    $grid.find(".empty-state").remove();
    $grid.prepend(buildTaskCard(newTask)); // prepend card to grid

    updateStats(); // increment Active Tasks (and Critical if applicable)
    closeTaskModal();
    resetTaskForm();
  });

  // ── Annotation 3: Volunteer form live clear ──
  $("#vol-name").on("input", function () {
    if ($(this).val().trim()) {
      $("#vol-name-error").text("");
      $(this).removeClass("error");
    }
  });

  $("#vol-email").on("input", function () {
    if (isValidEmail($(this).val())) {
      $("#vol-email-error").text("");
      $(this).removeClass("error");
    }
  });

  // ── Annotation 3: Register Volunteer submit ──
  $("#vol-submit-btn").on("click", function () {
    const name   = $("#vol-name").val().trim();
    const email  = $("#vol-email").val().trim();
    const skills = $("input[name='vol-skill']:checked").map(function () { return $(this).val(); }).get();

    let valid = true;

    if (!name) {
      $("#vol-name-error").text("Full name is required");
      $("#vol-name").addClass("error");
      valid = false;
    }
    if (!email || !isValidEmail(email)) {
      $("#vol-email-error").text("A valid email is required");
      $("#vol-email").addClass("error");
      valid = false;
    }
    if (!valid) return;

    const newVol = {
      id: nextVolId++,
      name,
      email,
      skills,
      availability: "available"  // annotation 3: initial availability
    };

    volunteers.push(newVol);
    renderVolunteers();
    updateStats(); // annotation 7: increment volunteer counter
    closeVolModal();
  });

}); // end $(function)

// ════════════════════════════════════════════════
// FORM RESET HELPERS
// ════════════════════════════════════════════════

function resetTaskForm() {
  $("#task-title").val("").removeClass("error");
  $("#task-desc").val("").removeClass("error");
  $("#task-priority").val("medium");
  $("#task-min-vol").val("1");
  $("input[name='skill']").prop("checked", false);
  $("#title-error, #desc-error").text("");
  $("#char-counter").text("0 / 200").removeClass("over");
}

function resetVolForm() {
  $("#vol-name, #vol-email").val("").removeClass("error");
  $("input[name='vol-skill']").prop("checked", false);
  $("#vol-name-error, #vol-email-error").text("");
}
