#!/usr/bin/env python3
"""
sync_office_docs.py — Synchronizes PODIUM_Requirements_Overview.docx and
PODIUM_Investment_Overview_Updated.pptx with the current platform state.

Updates applied:
1. PODIUM_Requirements_Overview.docx:
   - Updates module count to 5 (Core, Layer, Pulse, Monitor, Crew).
   - Removes Crew from Future Modules (delivered).
   - Adds Crew to Table 0 (Modules) with comprehensive operational description.
   - Updates Table 1 (Reach NFR) to include Crew mobile shift attendance and check-in.
   - Cleans and aligns Table 2 (Auth stack) and Table 3 (Project stack: api with Crew, postgres with crew schema).
   - Cleans Table 4 (Cost & Operational Simplicity) to keep cost items only.
   - Updates Table 5 (Technology Stack) with Crew Workforce, Crew UI Parity, External API, AI Tooling, Design System.
   - Inserts dedicated section: "Crew Module: Operational Workforce Planning, Rostering & Coverage"
     covering 1:1 legacy staff-app parity, zero-UUID interface, zero-status contracts, shift derivation,
     and coverage heatmap.
   - Inserts dedicated section: "Unified Shell & 3-Panel Command Deck Architecture"
     with real screenshot (docs/assets/welcome_screen_command_deck.png).
2. PODIUM_Investment_Overview_Updated.pptx:
   - Slide 2: Updates modular design card to include Crew (Core, Layer, Pulse, Monitor, Crew).
   - Slide 5: Updates Application Suite to mark Crew as Delivered workforce planning & rostering module.
   - Slide 6: Updates Modular Application Launcher card to include Workforce Planning (Crew).
   - Slide 8: Updates api container description to include Crew.
   - Slide 11: In-place update to Reliability & Openness slide footer callout for External API & MCP.
   - Slide 12: Updates Phase 4 Expansion roadmap to show Crew delivered.
   - Enforces zero-collision layout invariant across all slides prior to saving.
"""

import os
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import pptx
from pptx.util import Inches as PptxInches, Pt as PptxPt
from pptx.dml.color import RGBColor as PptxRGBColor
from pptx.enum.shapes import MSO_SHAPE

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
DOCX_PATH = os.path.join(REPO_ROOT, "docs", "PODIUM_Requirements_Overview.docx") if os.path.exists(os.path.join(REPO_ROOT, "docs", "PODIUM_Requirements_Overview.docx")) else os.path.join(REPO_ROOT, "PODIUM_Requirements_Overview.docx")
PPTX_PATH = os.path.join(REPO_ROOT, "docs", "PODIUM_Investment_Overview_Updated.pptx") if os.path.exists(os.path.join(REPO_ROOT, "docs", "PODIUM_Investment_Overview_Updated.pptx")) else os.path.join(REPO_ROOT, "PODIUM_Investment_Overview_Updated.pptx")
SCREENSHOT_PATH = os.path.join(REPO_ROOT, "docs", "assets", "welcome_screen_command_deck.png")


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set cell padding in twips."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)


def sync_docx(docx_path: str):
    print(f"[DOCX] Reading: {docx_path}")
    doc = docx.Document(docx_path)

    # 1. Update paragraph text for module counts
    for p in list(doc.paragraphs):
        if "The platform currently includes three core modules:" in p.text or \
           "The platform currently includes four core modules" in p.text or \
           "The platform currently delivers four modules:" in p.text:
            p.text = "The platform currently delivers five modules (Core, Layer, Pulse, Monitor, and Crew):"
            print("  [+] Updated module count paragraph to 5 modules")

        if "The platform consists of 12 containers" in p.text or \
           "The platform consists of 13" in p.text or \
           "The platform consists of 14" in p.text:
            p.text = (
                "The platform consists of 20 runtime containers organized into three decoupled stacks "
                "(podium-auth, podium-project1, podium-project2; detailed specifications in docs/11.CONTAINERS.md):"
            )
            print("  [+] Updated container inventory count paragraph to 20 containers across 3 stacks")

        # Remove Crew from Future Modules since it is now delivered
        if p.text.strip().startswith("Crew — Staff scheduling") or p.text.strip().startswith("Crew \u2014 Staff scheduling"):
            parent = p._element.getparent()
            parent.remove(p._element)
            print("  [+] Removed Crew from Future Modules (now delivered)")

    # 2. Update Table 0 (Modules list)
    table0 = doc.tables[0]
    existing_modules = [row.cells[0].text.strip() for row in table0.rows]
    if "Crew" not in existing_modules:
        row = table0.add_row()
        row.cells[0].text = "Crew"
        row.cells[1].text = (
            "Operational workforce planning, sporting event session scheduling, role-to-venue allocations matrix, "
            "shift derivation engine, coverage analytics heatmap, shift rostering, and mobile check-in"
        )
        print("  [+] Added Crew to Table 0 (Modules)")

    # 3. Update Table 1 (NFR Reach item if applicable)
    table1 = doc.tables[1]
    for row in table1.rows:
        if len(row.cells) >= 3 and row.cells[1].text.strip() == "Reach":
            if "Crew module" not in row.cells[2].text:
                row.cells[2].text = (
                    "Web-first responsive design. Pulse module installable as Progressive Web App (PWA) "
                    "for mobile-like experience; Crew module supports mobile on-site shift attendance and check-in."
                )
                print("  [+] Updated Table 1 (Reach NFR) with Crew mobile check-in")

    # 4. Clean up and Update Table 2 (podium-auth Central Identity Stack)
    table2 = doc.tables[2]
    # Remove any misplaced layer-pipeline row from Table 2 (layer-pipeline belongs in Table 3)
    rows_to_remove = []
    for idx, row in enumerate(table2.rows):
        if row.cells[0].text.strip() == "layer-pipeline":
            rows_to_remove.append(row._tr)
    for tr in rows_to_remove:
        table2._tbl.remove(tr)
        print("  [+] Removed misplaced layer-pipeline from Table 2 (Auth stack)")

    existing_containers = [row.cells[0].text.strip() for row in table2.rows]
    if "zitadel-login" not in existing_containers:
        row = table2.add_row()
        row.cells[0].text = "zitadel-login"
        row.cells[1].text = "ZITADEL Login v2 (latest)"
        row.cells[2].text = (
            "Official ZITADEL v4 Login v2 React UI. Proxied at /ui/v2/login, branded with "
            "Podium design tokens (Warm Paper / Obsidian Slate) and rostrum mark"
        )
        print("  [+] Added zitadel-login to Table 2 (Containers)")

    # 5. Update Table 3 (podium-project<N> Stack)
    table3 = doc.tables[3]
    for row in table3.rows:
        svc_name = row.cells[0].text.strip()
        if svc_name == "api":
            row.cells[2].text = "Unified backend. Mounts Shell, Layer, Pulse, Monitor, Crew, and module APIs under single origin"
            print("  [+] Updated api service in Table 3 to include Crew")
        elif svc_name == "postgres":
            row.cells[2].text = "Dedicated project database with WAL archiving. Isolated schemas per module (core, crew, layer, pulse, monitor, reporting)"
            print("  [+] Updated postgres service in Table 3 to include crew schema")

    # 6. Clean up Table 4 (Cost & Operational Simplicity)
    # Table 4 should only hold cost & environment setup items (rows 0, 1, 2)
    table4 = doc.tables[4]
    cost_rows_to_keep = []
    for r in list(table4.rows):
        first_cell = r.cells[0].text.strip()
        if first_cell in ["Monthly Hosting Cost", "$30\u201380/month", "$30-80/month", "One VPS, no managed-database bill"]:
            cost_rows_to_keep.append(r)
        else:
            table4._tbl.remove(r._tr)
            print(f"  [+] Cleaned misplaced tech row '{first_cell}' from Table 4")

    # 7. Update Table 5 (Component / Technology Stack)
    table5 = doc.tables[5]
    existing_tech = [row.cells[0].text.strip() for row in table5.rows]
    new_tech_items = [
        ("External API", "services/apigw (Fastify 5, OpenAPI 3.1.0, OAuth2 Client Credentials)"),
        ("AI Tooling", "Model Context Protocol (MCP) streamable HTTP server on /api/monitor/mcp"),
        ("Design System", "Two canonical themes: Warm Paper (#faf8f5) & Obsidian Slate (#17181c)"),
        ("Command Deck", "3-Panel Unified Shell (Left Identity Rail, Center Application Hub, Right Resource Hub)"),
        ("Connectors Vault", "Centralized SaaS credential vault (AES-256-GCM envelope encryption, multi-project shared)"),
        ("Layer Admin", "Venue Ingestion Queue, Managed Venues Reprocessing & Validation Workbench (docs/12.LAYER-ADMIN.md)"),
        ("Crew Workforce", "modules/crew (Event Sessions, Role x Venue Matrix, Shift Derivation, Coverage Analytics, Rostering)"),
        ("Crew UI Parity", "apps/shell/src/screens/crew (1:1 parity with legacy staff-app, zero-UUID inputs, mobile check-in)"),
        ("Documentation", "docs/11.CONTAINERS.md (Containers), docs/07.API.md (Full API Reference), docs/12.LAYER-ADMIN.md & docs/03.REQUIREMENTS.md")
    ]
    for comp, tech in new_tech_items:
        if comp not in existing_tech:
            row = table5.add_row()
            row.cells[0].text = comp
            row.cells[1].text = tech
            print(f"  [+] Added {comp} to Table 5 (Technology Stack)")

    # 8. Add Monitor Module Section if not already present
    has_monitor_section = any("Monitor Module:" in p.text for p in doc.paragraphs)
    if not has_monitor_section:
        target_idx = -1
        for i, p in enumerate(doc.paragraphs):
            if "Unified Shell & 3-Panel Command Deck" in p.text or "How Users Access the System" in p.text:
                target_idx = i
                break

        if target_idx != -1:
            target_p = doc.paragraphs[target_idx]

            def insert_p(text, style='Normal'):
                nonlocal target_p
                return target_p.insert_paragraph_before(text, style=style)

            insert_p("Monitor Module: Deployment Error Tracking, Incident Triage & AI Tooling (MCP)", style='Heading 2')
            insert_p(
                "Monitor is Podium's real-time observability, error tracking, and AI integration module. "
                "It provides deployment-wide incident visibility, user bug reporting, and direct integration "
                "with AI developer tools."
            )
            insert_p("How Monitor Works", style='Heading 3')
            insert_p("• Real-time error grouping: Automatically groups runtime exceptions by stack trace fingerprints with occurrence counters and first/last seen timestamps.")
            insert_p("• Incident triage workflows: Allows event staff to triage incidents (new, acknowledged, resolved, muted) and assign ownership.")
            insert_p("• User bug reporting: End-users and staff can submit bug reports directly from the UI with URL, browser context, description, and optional screenshot.")
            insert_p("• Incident statistics: Exposes deployment error rates, unhandled exception frequencies, and resolution health.")
            insert_p("Model Context Protocol (MCP) Integration", style='Heading 3')
            insert_p(
                "Monitor embeds an official Model Context Protocol (MCP) server exposed at `/api/monitor/mcp`. "
                "This allows AI assistants (such as Claude Code and Google Antigravity) to inspect active error groups, "
                "read triage queues, and perform full-text stack trace searches directly through streamable HTTP — "
                "with zero custom client code required."
            )
            insert_p("Zero-Infrastructure Footprint", style='Heading 3')
            insert_p(
                "The Monitor module and its MCP server run as in-process Fastify plugins inside the existing API container on port 3000. "
                "They require zero additional Docker containers and zero extra ports."
            )
            insert_p("")  # Spacing
            print("  [+] Inserted Monitor Module narrative section")

    # 9. Add Crew Module Section if not already present
    has_crew_section = any("Crew Module: Operational Workforce Planning" in p.text for p in doc.paragraphs)
    if not has_crew_section:
        target_idx = -1
        for i, p in enumerate(doc.paragraphs):
            if "Unified Shell & 3-Panel Command Deck" in p.text:
                target_idx = i
                break
        if target_idx == -1:
            for i, p in enumerate(doc.paragraphs):
                if "How Users Access the System" in p.text:
                    target_idx = i
                    break

        if target_idx != -1:
            target_p = doc.paragraphs[target_idx]

            def insert_crew_p(text, style='Normal'):
                nonlocal target_p
                return target_p.insert_paragraph_before(text, style=style)

            insert_crew_p("Crew Module: Operational Workforce Planning, Rostering & Coverage", style='Heading 1')
            insert_crew_p(
                "Crew is Podium's operational workforce management, sporting event session scheduling, "
                "shift derivation, and rostering module. Originating as a dedicated workforce application (staff-app), "
                "it has been completely unified into the Podium modular architecture with 1:1 functional parity, "
                "an isolated schema architecture (crew.*), strict zero-UUID human operator ergonomics, "
                "and zero artificial status fields."
            )

            insert_crew_p("Workforce Planning & Role-to-Venue Matrix", style='Heading 3')
            insert_crew_p("• Role Catalogue & Criticality: Defines operational workforce roles (e.g., Technology Manager, Venue Coordinator, Helpdesk Lead, Cable Tech) with operational color coding and criticality tiers (Standard, Critical, Essential) for coverage prioritization.")
            insert_crew_p("• Role \u00d7 Venue Allocations: Interactive matrix defining required headcount per role per venue, maximum venue headcount allocations, and minimum staff required per operational shift.")
            insert_crew_p("• Venue Groups: Grouping of operational venues (e.g., Metro Cluster, Outer Arenas) by shared zone and phase buffers with human-readable venue multi-selection.")

            insert_crew_p("Event Sessions & Phased Schedules", style='Heading 3')
            insert_crew_p("• Sporting & Event Sessions: Scheduling of competitive sporting sessions, ceremonies, rehearsals, and venue access windows with exact start/end times and session codes.")
            insert_crew_p("• Venue Participations: Association of venues with tournament phases and sessions, with configurable operational buffer before and buffer after windows.")
            insert_crew_p("• Operational Phases: Phased event timeline management (Bump-In, Warm-Up, Competition, Finals, Bump-Out) with color badges, sort ordering, and phase deletion safeguards preventing accidental removal of active phases.")

            insert_crew_p("Shift Derivation & Coverage Heatmap Engine", style='Heading 3')
            insert_crew_p("• Automated Shift Derivation: Mathematical derivation of required operational shifts from event sessions, venue groups, and role allocations across the entire tournament calendar.")
            insert_crew_p("• Day Overrides Grid: Granular per-day adjustments to derived shifts, allowing operational planners to adjust start times, end times, and required headcounts for specific high-demand match days.")
            insert_crew_p("• Coverage Analysis Heatmap: Visual real-time gap analysis comparing required headcount against rostered personnel across all venues, phases, and roles with green (fully covered), amber (partially covered), and red (deficit) indicators.")

            insert_crew_p("Rostering, Auto-Assignment & Shift Attendance", style='Heading 3')
            insert_crew_p("• Rostering Workbench: Interactive drag-and-drop and one-click staff assignment to derived shifts with operational conflict detection (preventing double-booking or rest-period violations).")
            insert_crew_p("• Automated Rostering Engine: Greedy and constraint-satisfaction assignment algorithm that matches available personnel credentials and role qualifications to vacant shifts.")
            insert_crew_p("• Shift Attendance & Mobile Check-In: On-site verification allowing supervisors and staff to record check-in and check-out timestamps with location context.")
            insert_crew_p("• Data Portability: Native round-trip XLSX spreadsheet import and export for bulk staffing rosters and legacy system integration.")

            insert_crew_p("Zero-UUID Operator Ergonomics & Fastify Module Architecture", style='Heading 3')
            insert_crew_p("• Zero-UUID Form Inputs: All operator dropdowns, selection pills, and venue group editors operate exclusively on human-readable codes, venue names, and natural keys\u2014never exposing internal technical UUIDs to event staff.")
            insert_crew_p("• Schema-Per-Module Isolation: Completely contained in Postgres schema crew with dedicated role podium_crew, audited writes via AuditedRepository, and zero cross-schema SQL joins.")
            insert_crew_p("")  # Spacing
            print("  [+] Inserted Crew Module narrative section")

    # 10. Add or Update Unified Shell & 3-Panel Command Deck Section
    has_command_deck = any("Unified Shell & 3-Panel Command Deck" in p.text for p in doc.paragraphs)
    if has_command_deck:
        print("  [+] Updating existing Unified Shell & 3-Panel Command Deck section")
        for i, p in enumerate(doc.paragraphs):
            if "Figure: Podium Unified Shell" in p.text:
                p.text = "Figure: Podium Unified Shell — 3-Panel Command Deck & Resource Connectors (Warm Paper Theme)"
                if p.runs:
                    p.runs[0].font.size = Pt(9.5)
                    p.runs[0].font.italic = True
                # Refresh screenshot in the preceding image paragraph
                img_p = doc.paragraphs[i - 1]
                img_p.clear()
                if os.path.exists(SCREENSHOT_PATH):
                    img_p.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER
                    run = img_p.add_run()
                    run.add_picture(SCREENSHOT_PATH, width=Inches(6.2))
                    print("  [+] Refreshed embedded screenshot in Word document")

            if "3. Right Resource Hub:" in p.text:
                p.text = "3. Right Resource Hub: Available & Upcoming Integrations"
            if "Enterprise SaaS integration: Live status badges" in p.text:
                p.text = "• Available integrations: Direct single-sign connectivity for Smartsheet as the primary schedule, milestone, and project timeline source."
            if "Single-Sign connectivity: Direct authorization links" in p.text:
                p.text = "• Coming soon integrations: Planned integration hooks for Jira Software (operational issues & engineering tasks) and Microsoft 365 (enterprise calendar & scheduling sync)."
            if "Envelope encryption: Credentials are sealed" in p.text:
                p.text = "• In-session credential synchronization: Real-time background polling (30s interval) and manual refresh controls ensuring instant connection state reactivity."
    else:
        target_idx = -1
        for i, p in enumerate(doc.paragraphs):
            if "How Users Access the System" in p.text:
                target_idx = i
                break

        if target_idx != -1:
            target_p = doc.paragraphs[target_idx]

            def insert_p(text, style='Normal'):
                nonlocal target_p
                return target_p.insert_paragraph_before(text, style=style)

            insert_p("Unified Shell & 3-Panel Command Deck Architecture", style='Heading 1')
            insert_p(
                "The primary operator interface to the Podium Platform is an industrial three-panel Command Deck (apps/shell). "
                "Engineered for high-stakes major event technology deployments, it unifies organization identity, real-time "
                "enterprise SaaS connector management, multi-module application switching, and venue drawing pipeline operations "
                "into a single, high-density operational cockpit."
            )

            # Embed live screenshot
            if os.path.exists(SCREENSHOT_PATH):
                p_img = insert_p("")
                p_img.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER
                run = p_img.add_run()
                run.add_picture(SCREENSHOT_PATH, width=Inches(6.2))
                p_cap = insert_p("Figure: Podium Unified Shell — 3-Panel Command Deck & Resource Connectors (Warm Paper Theme)")
                p_cap.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER
                if p_cap.runs:
                    p_cap.runs[0].font.size = Pt(9.5)
                    p_cap.runs[0].font.italic = True
                print("  [+] Embedded live screenshot into Word document")

            insert_p("1. Left Identity Rail: Co-Branded Experience & Session Governance", style='Heading 2')
            insert_p("• Co-branded project identity: The upper masthead pairs the terracotta Podium Platform brand mark alongside the active project emblem (e.g. PODIUM / P1 Project 1).")
            insert_p("• Identity & role contextualization: Prominently renders the authenticated operator's avatar, display name, and contextual role designation (e.g. Lead Architect • Admin, Spatial CAD Specialist, Operations Planner).")
            insert_p("• Tactile theme switcher: Instant zero-FOUC toggle between the two canonical themes: Warm Paper (#faf8f5 light) and Obsidian Slate (#17181c dark).")
            insert_p("• Pinned controls: Immediate access to Cross-Project navigation, Admin Governance, System Configuration, and instant session logout.")

            insert_p("2. Center Workspace Deck: Multi-Module Hub & Active Project Context", style='Heading 2')
            insert_p("• Active project stack selector: Allows operators to seamlessly switch active execution context between project1.podium.test and project2.podium.test with zero re-authentication via silent SSO.")
            insert_p("• Global search filter: Real-time fuzzy search across active modules, venue drawing sheets, and operational schedules.")
            insert_p("• Modular application cards: Interactive tactile cards for Core, Layer (Spatial CAD), Pulse (Schedule Checklists), Monitor (Error Telemetry & MCP), and Control Room (Access Directory) with compact high-density layout.")

            insert_p("3. Right Resource Hub: Available & Upcoming Integrations", style='Heading 2')
            insert_p("• Available integrations: Direct single-sign connectivity for Smartsheet as the primary schedule, milestone, and project timeline source.")
            insert_p("• Coming soon integrations: Planned integration hooks for Jira Software (operational issues & engineering tasks) and Microsoft 365 (enterprise calendar & scheduling sync).")
            insert_p("• In-session credential synchronization: Real-time background polling (30s interval) and manual refresh controls ensuring instant connection state reactivity.")

            insert_p("4. Layer Drawing Pipeline: Managed Venues & Architectural Reprocessing", style='Heading 2')
            insert_p("• Managed Venues dashboard: Direct visibility and control over canonical production venues (ALA - Alvalade Arena, DAR - Darwin Convention Centre) with system status, drawing pipeline status, and last processed timestamp.")
            insert_p("• Architectural drawing reprocessing: Dedicated 'New Version / Reprocess' drawer allowing operators to upload updated architectural sheets (ANSI D/E floor plans) for existing venues without re-creating records.")
            insert_p("• 9-stage ingestion worker: PyMuPDF rasterization, space code extraction, vector tile pyramid rendering, and scale verification.")
            insert_p("• Quality validation workbench: Visual scale verification and interactive staging tile preview before promoting drawings to production.")

            insert_p("5. Multi-Project Topology & Silent Single Sign-On", style='Heading 2')
            insert_p("• VPS-agnostic deployment parity: Stacks operate identically co-located on a single host or distributed across multiple VPS instances.")
            insert_p("• Centralized identity broker: Single IdP stack (auth.podium.test) handles upstream federation and token minting for all projects.")
            insert_p("• Zero-prompt silent SSO: Operators navigate seamlessly between project1 and project2 without re-entering credentials.")
            insert_p("")
            print("  [+] Inserted Unified Shell & 3-Panel Command Deck narrative section")

    doc.save(docx_path)
    print(f"[DOCX] Successfully saved: {docx_path}\n")


def verify_no_pptx_collisions(prs: pptx.Presentation):
    """
    Validates that no slide contains colliding or overlapping text boxes.
    Enforces the zero-overlap layout invariant across all slides.
    """
    for idx, slide in enumerate(prs.slides):
        text_shapes = []
        for s_idx, shape in enumerate(slide.shapes):
            if shape.has_text_frame and shape.text.strip():
                text_shapes.append((s_idx, shape))

        # Check for bounding box collisions between distinct text-containing shapes
        for i in range(len(text_shapes)):
            for j in range(i + 1, len(text_shapes)):
                idx_a, shape_a = text_shapes[i]
                idx_b, shape_b = text_shapes[j]

                a_l, a_t = shape_a.left, shape_a.top
                a_r, a_b = shape_a.left + shape_a.width, shape_a.top + shape_a.height

                b_l, b_t = shape_b.left, shape_b.top
                b_r, b_b = shape_b.left + shape_b.width, shape_b.top + shape_b.height

                overlap_x = max(0, min(a_r, b_r) - max(a_l, b_l))
                overlap_y = max(0, min(a_b, b_b) - max(a_t, b_t))

                if overlap_x > PptxInches(0.1) and overlap_y > PptxInches(0.1):
                    raise ValueError(
                        f"Layout collision detected on Slide {idx + 1}: "
                        f"Shape {idx_a} ('{shape_a.text.strip()[:25]}...') overlaps with "
                        f"Shape {idx_b} ('{shape_b.text.strip()[:25]}...')"
                    )

        # Check for text overflow in fixed-height title/header shapes
        for s_idx, shape in text_shapes:
            non_empty_p = [p for p in shape.text_frame.paragraphs if p.text.strip()]
            if len(non_empty_p) > 3 and shape.height < PptxInches(1.0):
                raise ValueError(
                    f"Text overflow detected on Slide {idx + 1}, Shape {s_idx}: "
                    f"{len(non_empty_p)} paragraphs inside fixed height {shape.height/PptxInches(1):.2f}\""
                )


def sync_pptx(pptx_path: str):
    print(f"[PPTX] Generating 15-slide revamped presentation: {pptx_path}")
    prs = pptx.Presentation()
    prs.slide_width = PptxInches(10.0)
    prs.slide_height = PptxInches(5.625)
    blank_layout = prs.slide_layouts[6]

    COLOR_WARM_PAPER = PptxRGBColor(0xFA, 0xF8, 0xF5)
    COLOR_OBSIDIAN = PptxRGBColor(0x17, 0x18, 0x1C)
    COLOR_ESPRESSO = PptxRGBColor(0x2C, 0x18, 0x10)
    COLOR_CHARCOAL = PptxRGBColor(0x4A, 0x40, 0x3A)
    COLOR_TERRACOTTA = PptxRGBColor(0x8B, 0x45, 0x13)
    COLOR_CARD_BG = PptxRGBColor(0xF3, 0xEE, 0xE8)
    COLOR_CARD_BORDER = PptxRGBColor(0xDF, 0xD7, 0xCE)
    COLOR_CALLOUT_BG = PptxRGBColor(0xEB, 0xE3, 0xD8)
    COLOR_MUTED = PptxRGBColor(0x6B, 0x5B, 0x4F)
    COLOR_DARK_TEXT = PptxRGBColor(0x20, 0x20, 0x20)

    COLOR_DARK_CARD_BG = PptxRGBColor(0x23, 0x24, 0x2A)
    COLOR_DARK_TITLE = PptxRGBColor(0xF5, 0xF0, 0xEB)
    COLOR_DARK_SUB = PptxRGBColor(0xD0, 0xC8, 0xBF)
    COLOR_DARK_KICKER = PptxRGBColor(0xE0, 0x90, 0x60)

    def set_slide_background(slide, color):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, kicker: str, title: str, subtitle: str, dark: bool = False):
        k_box = slide.shapes.add_textbox(PptxInches(0.60), PptxInches(0.35), PptxInches(8.80), PptxInches(0.25))
        tf_k = k_box.text_frame
        tf_k.word_wrap = True
        tf_k.margin_left = tf_k.margin_top = tf_k.margin_right = tf_k.margin_bottom = 0
        p_k = tf_k.paragraphs[0]
        p_k.text = kicker.upper()
        p_k.font.name = "Calibri"
        p_k.font.size = PptxPt(10)
        p_k.font.bold = True
        p_k.font.color.rgb = COLOR_DARK_KICKER if dark else COLOR_TERRACOTTA

        t_box = slide.shapes.add_textbox(PptxInches(0.60), PptxInches(0.60), PptxInches(8.80), PptxInches(0.45))
        tf_t = t_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.name = "Cambria"
        p_t.font.size = PptxPt(22)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_DARK_TITLE if dark else COLOR_ESPRESSO

        s_box = slide.shapes.add_textbox(PptxInches(0.60), PptxInches(1.08), PptxInches(8.80), PptxInches(0.35))
        tf_s = s_box.text_frame
        tf_s.word_wrap = True
        tf_s.margin_left = tf_s.margin_top = tf_s.margin_right = tf_s.margin_bottom = 0
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle
        p_s.font.name = "Calibri"
        p_s.font.size = PptxPt(11)
        p_s.font.color.rgb = COLOR_DARK_SUB if dark else COLOR_CHARCOAL

    def add_card(slide, left, top, width, height, title, body_paragraphs, dark: bool = False, accent_title: bool = False):
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_DARK_CARD_BG if dark else COLOR_CARD_BG
        card.line.color.rgb = COLOR_DARK_CARD_BG if dark else COLOR_CARD_BORDER
        card.line.width = PptxPt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = PptxInches(0.14)
        tf.margin_right = PptxInches(0.14)
        tf.margin_top = PptxInches(0.12)
        tf.margin_bottom = PptxInches(0.10)

        if title:
            p0 = tf.paragraphs[0]
            p0.text = title
            p0.font.name = "Calibri"
            p0.font.size = PptxPt(11.5)
            p0.font.bold = True
            p0.font.color.rgb = COLOR_DARK_KICKER if dark else (COLOR_TERRACOTTA if accent_title else COLOR_ESPRESSO)

        for idx, bp in enumerate(body_paragraphs):
            p = tf.add_paragraph() if (title or idx > 0) else tf.paragraphs[0]
            p.text = bp
            p.font.name = "Calibri"
            p.font.size = PptxPt(9.5)
            p.font.color.rgb = COLOR_DARK_SUB if dark else COLOR_DARK_TEXT
            p.space_before = PptxPt(4)

        return card

    def add_footer_banner(slide, left, top, width, height, text: str, dark: bool = False):
        banner = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
        banner.fill.solid()
        banner.fill.fore_color.rgb = COLOR_DARK_CARD_BG if dark else COLOR_CALLOUT_BG
        banner.line.color.rgb = COLOR_DARK_CARD_BG if dark else COLOR_CARD_BORDER
        banner.line.width = PptxPt(1)

        tf = banner.text_frame
        tf.word_wrap = True
        tf.margin_left = PptxInches(0.16)
        tf.margin_right = PptxInches(0.16)
        tf.margin_top = PptxInches(0.08)
        tf.margin_bottom = PptxInches(0.08)

        p = tf.paragraphs[0]
        p.text = text
        p.font.name = "Calibri"
        p.font.size = PptxPt(9.5)
        p.font.color.rgb = COLOR_DARK_TITLE if dark else COLOR_ESPRESSO
        return banner

    # ==================== SLIDE 1: TITLE SLIDE (Obsidian Slate Theme) ====================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, COLOR_OBSIDIAN)

    k1 = s1.shapes.add_textbox(PptxInches(1.0), PptxInches(1.30), PptxInches(8.0), PptxInches(0.35))
    tf1_k = k1.text_frame
    tf1_k.word_wrap = True
    p1_k = tf1_k.paragraphs[0]
    p1_k.text = "PODIUM PLATFORM"
    p1_k.font.name = "Calibri"
    p1_k.font.size = PptxPt(13)
    p1_k.font.bold = True
    p1_k.font.color.rgb = COLOR_DARK_KICKER

    t1 = s1.shapes.add_textbox(PptxInches(1.0), PptxInches(1.70), PptxInches(8.0), PptxInches(1.10))
    tf1_t = t1.text_frame
    tf1_t.word_wrap = True
    p1_t = tf1_t.paragraphs[0]
    p1_t.text = "Venue Technology Operations Platform"
    p1_t.font.name = "Cambria"
    p1_t.font.size = PptxPt(32)
    p1_t.font.bold = True
    p1_t.font.color.rgb = COLOR_DARK_TITLE

    sub1 = s1.shapes.add_textbox(PptxInches(1.0), PptxInches(2.90), PptxInches(8.0), PptxInches(0.60))
    tf1_s = sub1.text_frame
    tf1_s.word_wrap = True
    p1_s = tf1_s.paragraphs[0]
    p1_s.text = "One login. One database. One deployment per customer. Engineered for major events and multi-venue tournaments."
    p1_s.font.name = "Calibri"
    p1_s.font.size = PptxPt(14)
    p1_s.font.color.rgb = COLOR_DARK_SUB

    foot1 = s1.shapes.add_textbox(PptxInches(1.0), PptxInches(4.50), PptxInches(8.0), PptxInches(0.40))
    tf1_f = foot1.text_frame
    tf1_f.word_wrap = True
    p1_f = tf1_f.paragraphs[0]
    p1_f.text = "Operational Concept & Architectural Defense | September 2026"
    p1_f.font.name = "Calibri"
    p1_f.font.size = PptxPt(10.5)
    p1_f.font.color.rgb = COLOR_DARK_SUB

    # ==================== SLIDE 2: THE OPERATIONAL REALITY ====================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, COLOR_WARM_PAPER)
    add_header(s2, "Operational Context", "The Operational Reality of Major Events", "Why technology delivery for international tournaments differs fundamentally from standard enterprise IT.")
    
    cards_s2 = [
        ("Fixed Deadlines", ["Event opening dates and global broadcast windows cannot be postponed.", "Systems, cabling, networking gear, and staff must be verified on schedule."]),
        ("Physical Distribution", ["Operations span multiple stadiums, temporary arenas, training facilities, and media hubs.", "Field teams require instant spatial context across entire metropolitan areas."]),
        ("Ecosystem of Partners", ["The Venue Technology team coordinates dozens of external contractors.", "Cabling vendors, telecom carriers, timing partners, and broadcast crews work side by side."]),
        ("Host-Nation Sovereignty", ["Organizing committees operate under strict local privacy regulations and host compliance.", "Dedicated customer deployments enable clean post-event handover."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s2):
        add_card(s2, PptxInches(0.60 + idx * 2.25), PptxInches(1.55), PptxInches(2.05), PptxInches(3.30), c_title, c_body)

    # ==================== SLIDE 3: FIVE POINTS OF OPERATIONAL FRICTION ====================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, COLOR_WARM_PAPER)
    add_header(s3, "Current Challenges", "Five Points of Operational Friction", "How disconnected tools create confusion, blind spots, and delivery risks during tournament buildout.")

    cards_s3 = [
        ("1. Disconnected CAD", ["Architectural blueprints arrive as heavy multi-page CAD sheets.", "Engineers waste hours opening disconnected files to find specific rooms."]),
        ("2. Desktop Schedules", ["VTIP and VROS plans live inside desktop spreadsheets.", "Field technicians cannot read heavy 5,000-line Gantt charts on their phones."]),
        ("3. Equipment Blind Spots", ["Hardware asset tracking lives isolated in ServiceNow.", "Venue managers on the ground lack live visibility into device delivery on site."]),
        ("4. Fragile Rostering", ["Managing hundreds of techs in spreadsheets causes silent formula errors.", "Critical timing desks risk being left unstaffed during live competition sessions."]),
        ("5. Crew Contact Gaps", ["Static paper rosters cannot reflect who is on shift right now.", "Supervisors lose critical minutes locating the technician assigned to a problem zone."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s3):
        add_card(s3, PptxInches(0.60 + idx * 1.79), PptxInches(1.55), PptxInches(1.64), PptxInches(3.30), c_title, c_body, accent_title=True)

    # ==================== SLIDE 4: THE PODIUM SOLUTION & OPERATIONAL ARCHITECTURE ====================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, COLOR_WARM_PAPER)
    add_header(s4, "Architecture Overview", "The Podium Operational Architecture", "Four cohesive operational pillars uniting spatial planning, mobile execution, workforce, and governance.")

    pillars = [
        ("SPATIAL PLANNING (Layer)", ["Full venue at a glance on a continuous Leaflet canvas.", "Rapid space discovery and room area calculations.", "Visual element planning and cross-partner review comments before physical rollout."]),
        ("MOBILE COCKPIT (Pulse)", ["Mobile-first venue cockpit bringing Venue Magic directly to field hands.", "Syncs VTIP and VROS schedule milestones from Smartsheet.", "Live ServiceNow device deployment status and instant venue crew phone contacts."]),
        ("WORKFORCE MANAGEMENT (Crew)", ["Tournament competition session modeling and operating windows.", "Pure-function shift derivation enforcing rest-day and maximum hour rules.", "Visual coverage heatmaps and on-site mobile check-in."]),
        ("SECURITY & GOVERNANCE (Foundation)", ["Central ZITADEL identity broker with enterprise SSO federation.", "Sub-second session revocation (<1.0s) via Redis pub/sub.", "PostgreSQL schema-per-module isolation and immutable in-transaction audit logs."]),
    ]
    add_card(s4, PptxInches(0.60), PptxInches(1.55), PptxInches(4.25), PptxInches(1.55), pillars[0][0], pillars[0][1], accent_title=True)
    add_card(s4, PptxInches(5.15), PptxInches(1.55), PptxInches(4.25), PptxInches(1.55), pillars[1][0], pillars[1][1], accent_title=True)
    add_card(s4, PptxInches(0.60), PptxInches(3.30), PptxInches(4.25), PptxInches(1.55), pillars[2][0], pillars[2][1], accent_title=True)
    add_card(s4, PptxInches(5.15), PptxInches(3.30), PptxInches(4.25), PptxInches(1.55), pillars[3][0], pillars[3][1], accent_title=True)

    # ==================== SLIDE 5: LAYER DEEP DIVE ====================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, COLOR_WARM_PAPER)
    add_header(s5, "Module Deep Dive", "Layer: Spatial CAD & Partner Collaboration", "Accelerating drawing consumption and pre-deployment spatial validation across partners.")

    cards_s5 = [
        ("Full Venue at a Glance", ["The 9-stage Python ingestion pipeline rasterizes architectural sheets into a continuous map tile pyramid.", "Users pan and zoom smoothly across the entire venue on field tablets without loading heavy vector files."]),
        ("Rapid Space Discovery", ["Space polygons are extracted automatically and room surface areas are calculated using the Shoelace formula.", "Field technicians search for room codes and jump directly to their exact physical location on the canvas."]),
        ("Cross-Partner Collaboration", ["Creates a shared continuous canvas for the Venue Technology team and external cabling/telecom contractors.", "Teams place equipment markers visually and leave review comments to resolve spatial clashes before physical buildout."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s5):
        add_card(s5, PptxInches(0.60 + idx * 3.00), PptxInches(1.55), PptxInches(2.80), PptxInches(2.80), c_title, c_body)
    add_footer_banner(s5, PptxInches(0.60), PptxInches(4.50), PptxInches(8.80), PptxInches(0.48), "Ingestion Pipeline: PyMuPDF rasterization, scale error verification (<1.0%), space code extraction, and ephemeral source blueprint destruction.")

    # ==================== SLIDE 6: PULSE DEEP DIVE ====================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, COLOR_WARM_PAPER)
    add_header(s6, "Module Deep Dive", "Pulse: The Mobile Venue Cockpit", "Venue Magic: putting live project schedules, hardware readiness, and team contacts into technicians' hands.")

    cards_s6 = [
        ("Mobile VTIP & VROS Sync", ["Direct integration with external Smartsheet workspaces where master project plans live.", "Field technicians view upcoming milestones, filter tasks due today in their venue, and submit quick updates."]),
        ("ServiceNow Asset Tracking", ["Live connection to ServiceNow Table API displaying hardware deployment status on site.", "Technicians verify delivery and installation of network switches, wireless access points, and timing cameras."]),
        ("Live Venue Crew Contacts", ["Surfaces active shifts and working personnel currently assigned to that specific venue.", "Provides one-tap phone dialing and radio call signs for immediate on-site problem resolution."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s6):
        add_card(s6, PptxInches(0.60 + idx * 3.00), PptxInches(1.55), PptxInches(2.80), PptxInches(2.80), c_title, c_body)
    add_footer_banner(s6, PptxInches(0.60), PptxInches(4.50), PptxInches(8.80), PptxInches(0.48), "Connector Security: AES-256-GCM encrypted credential vault with monotonic PostgreSQL advisory locks to prevent token refresh race conditions.")

    # ==================== SLIDE 7: CREW DEEP DIVE ====================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7, COLOR_WARM_PAPER)
    add_header(s7, "Module Deep Dive", "Crew: Workforce Planning & Mathematical Rostering", "Eliminating spreadsheet fragility with deterministic shift derivation and real-time coverage heatmaps.")

    cards_s7 = [
        ("Tournament Session Modeling", ["Models sporting competition sessions, operating windows, and configurable preparation buffers.", "Defines baseline headcount requirements per shift, essential technical roles, and shared roving specialists."]),
        ("Deterministic Shift Derivation", ["A pure computational function (derive.ts) calculates daily operating hours and shift splits automatically.", "Enforces legal maximum working hours (8h daily) and mandatory rest days (6 consecutive days maximum)."]),
        ("Visual Coverage Heatmap", ["Real-time coverage comparison displaying shortfall, surplus, adequate, and accepted status badges.", "Alerts managers immediately if overlapping tournament sessions leave a critical timing desk unmanned."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s7):
        add_card(s7, PptxInches(0.60 + idx * 3.00), PptxInches(1.55), PptxInches(2.80), PptxInches(2.80), c_title, c_body)
    add_footer_banner(s7, PptxInches(0.60), PptxInches(4.50), PptxInches(8.80), PptxInches(0.48), "Workforce Isolation: People and contractor rosters live strictly in Crew; mobile shift attendance and check-in supported at /crew/my-shifts.")

    # ==================== SLIDE 8: FOUNDATION, GOVERNANCE & AUDIT ====================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8, COLOR_WARM_PAPER)
    add_header(s8, "Platform Spine", "Consolidated Security, Governance & Audit", "Pure platform security and administration: central identity, instant revocation, and immutable compliance.")

    cards_s8 = [
        ("ZITADEL Identity Broker", ["Self-hosted identity broker handling enterprise SSO federation with Microsoft Entra ID, Google Workspace, and Okta.", "Zero per-seat licensing fees for scaling up thousands of temporary event staff."]),
        ("Sub-Second Revocation (<1.0s)", ["Redis pub/sub combined with a short polling fallback ensures instant session eviction.", "Disabling a compromised badge or lost laptop cuts active access globally across all apps in under 1 second."]),
        ("Schema-Per-Module Isolation", ["PostgreSQL role privileges physically enforce database barriers between modules.", "Layer cannot query Pulse tables, and Pulse cannot alter Crew rosters directly."]),
        ("Immutable In-Transaction Audit", ["Every mutating API request records an entry in core.audit_events within the exact same database transaction.", "Enforced as INSERT-only by PostgreSQL role permissions; history cannot be altered."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s8):
        add_card(s8, PptxInches(0.60 + idx * 2.25), PptxInches(1.55), PptxInches(2.05), PptxInches(3.30), c_title, c_body)

    # ==================== SLIDE 9: 3-PANEL COMMAND DECK ====================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9, COLOR_WARM_PAPER)
    add_header(s9, "User Experience", "3-Panel Command Deck & Connectors", "Industrial multi-project operational cockpit with modular app launchers and enterprise SaaS integrations.")

    if os.path.exists(SCREENSHOT_PATH):
        s9.shapes.add_picture(SCREENSHOT_PATH, PptxInches(0.60), PptxInches(1.55), PptxInches(4.75), PptxInches(2.67))
        cap = s9.shapes.add_textbox(PptxInches(0.60), PptxInches(4.28), PptxInches(4.75), PptxInches(0.25))
        tf_cap = cap.text_frame
        tf_cap.word_wrap = True
        tf_cap.margin_left = tf_cap.margin_top = tf_cap.margin_right = tf_cap.margin_bottom = 0
        p_c = tf_cap.paragraphs[0]
        p_c.text = "Figure: Live 3-Panel Command Deck on Warm Paper theme"
        p_c.font.name = "Calibri"
        p_c.font.size = PptxPt(9)
        p_c.font.italic = True
        p_c.font.color.rgb = COLOR_MUTED

    cards_s9 = [
        ("Identity & Governance Rail", ["Co-branded project logos, active role designations, Warm Paper/Obsidian Slate theme toggle, and instant session revocation."]),
        ("Modular Application Launcher", ["Tactile cards for Layer (CAD Spatial), Pulse (Mobile Cockpit), Crew (Rostering), and Monitor (Observability)."]),
        ("Enterprise Resource Hub", ["Direct connectors for Smartsheet (VTIP/VROS) and ServiceNow (Assets), with planned hooks for Jira and Microsoft 365."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s9):
        add_card(s9, PptxInches(5.55), PptxInches(1.55 + idx * 0.96), PptxInches(3.85), PptxInches(0.88), c_title, c_body)

    add_footer_banner(s9, PptxInches(0.60), PptxInches(4.65), PptxInches(8.80), PptxInches(0.40), "Ergonomics: Two verified themes (Warm Paper for outdoor sunlight, Obsidian Slate for dark control rooms) and Five-Tape visual hierarchy.")

    # ==================== SLIDE 10: FOUR STAKEHOLDER PERSONAS ====================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10, COLOR_WARM_PAPER)
    add_header(s10, "Value in Practice", "Value Across Key Stakeholder Roles", "How Podium addresses the specific priorities of event directors, field leads, contractors, and security officers.")

    cards_s10 = [
        ("Project & Tech Directors", ["Predictable fixed-deadline milestone tracking.", "Zero per-seat licensing penalties when scaling staff.", "Unified vendor accountability across contractors.", "Clean post-event database handover."]),
        ("Venue Tech Leads & Field", ["Continuous CAD space discovery on field tablets.", "Mobile VTIP and VROS task updates on the go.", "Live ServiceNow equipment delivery status.", "Instant phone contacts for active venue crew."]),
        ("External Partners & Teams", ["Rapid room and closet discovery across venues.", "Collaborative CAD review comments on one canvas.", "Clear, conflict-free shift rosters.", "Quick mobile attendance check-in."]),
        ("CISOs & Security Architects", ["Dedicated customer database boundary.", "Sub-second session revocation (<1.0s).", "PostgreSQL role-level schema barriers.", "Immutable append-only in-transaction audit log."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s10):
        add_card(s10, PptxInches(0.60 + idx * 2.25), PptxInches(1.55), PptxInches(2.05), PptxInches(3.30), c_title, c_body)

    # ==================== SLIDE 11: DESIGN IT TWICE - PART 1 ====================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11, COLOR_WARM_PAPER)
    add_header(s11, "Technical Justification", "Design It Twice: Monolith & Database Access", "Contrasting core architecture decisions against viable alternatives to highlight operational failure modes.")

    add_card(s11, PptxInches(0.60), PptxInches(1.55), PptxInches(4.25), PptxInches(3.30), "Decision 1: Modular Monolith vs. Microservices", [
        "CHOSEN (Podium Modular Monolith):",
        "One Fastify API container compiling all enabled modules in-process, sharing one PostgreSQL database.",
        "Business updates, audit logs, and outbox events commit in the exact same transaction with zero network latency.",
        "Local testing requires just Docker Compose; runs on a modest $30 to $80 monthly virtual server.",
        "REJECTED ALTERNATIVE (8 Microservices on Kubernetes):",
        "Distributed transactions cannot guarantee consistency without complex saga orchestrators.",
        "Network latency and inter-service timeouts risk data desynchronization during live broadcast operations.",
        "Requires dedicated Kubernetes DevOps personnel and costs $1,500+ monthly in cloud infrastructure."
    ])

    add_card(s11, PptxInches(5.15), PptxInches(1.55), PptxInches(4.25), PptxInches(3.30), "Decision 2: Plain SQL vs. Traditional ORMs", [
        "CHOSEN (Plain SQL Repositories with AuditedRepository):",
        "Explicit SQL queries wrapped in typed repositories paired with dedicated PostgreSQL roles per module.",
        "Security boundaries are enforced directly by the database kernel (Layer cannot query Pulse tables).",
        "Every database query is indexed, visible, and automatically logs before-and-after audit diffs in-transaction.",
        "REJECTED ALTERNATIVE (Traditional ORMs like Prisma or TypeORM):",
        "ORMs struggle with database role-level permissions and cannot enforce schema access barriers.",
        "Frequently generate inefficient queries and introduce N+1 performance bottlenecks under peak event load.",
        "Abstract the database layer, making transactional audit guarantees difficult to verify."
    ])

    # ==================== SLIDE 12: DESIGN IT TWICE - PART 2 ====================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12, COLOR_WARM_PAPER)
    add_header(s12, "Technical Justification", "Design It Twice: Isolation Boundary & Identity", "Contrasting customer isolation and identity choices against viable alternatives to highlight operational failure modes.")

    add_card(s12, PptxInches(0.60), PptxInches(1.55), PptxInches(4.25), PptxInches(3.30), "Decision 3: Dedicated VPS vs. Shared Cloud SaaS", [
        "CHOSEN (Dedicated Isolated Stack Per Customer):",
        "Completely isolated container stack, PostgreSQL database, and private network perimeter per customer.",
        "Complete blast-radius isolation: an issue in one tournament never impacts another event.",
        "Predictable handover: customer receives their complete database archive (pg_dump) with zero extraction fees.",
        "REJECTED ALTERNATIVE (Shared Multi-Customer SaaS):",
        "All customer data resides in one shared database distinguished only by an organization ID column.",
        "A migration error or query spike caused by one customer degrades performance for all tournaments.",
        "Cross-customer data leakage risks violate host-nation data sovereignty regulations."
    ])

    add_card(s12, PptxInches(5.15), PptxInches(1.55), PptxInches(4.25), PptxInches(3.30), "Decision 4: Self-Hosted ZITADEL v4 vs. Auth0", [
        "CHOSEN (Self-Hosted ZITADEL v4 with Redis Pub/Sub):",
        "Provides open-source enterprise SSO federation (Microsoft Entra ID, Google, Okta) in its core edition.",
        "Paired with Redis pub/sub to cut active user sessions globally across all applications in under 1.0 second.",
        "Zero per-seat licensing penalties when onboarding hundreds of temporary tournament contractors.",
        "REJECTED ALTERNATIVE (Authentik Community Edition or Auth0):",
        "Authentik CE paywalls native enterprise identity provider synchronization behind commercial licenses.",
        "Auth0 charges steep per-seat monthly fees that become cost-prohibitive when scaling event workforces.",
        "Managed third-party identity services send authentication metadata to shared external clouds."
    ])

    # ==================== SLIDE 13: DELIVERY SCOPE & CONTAINER TOPOLOGY ====================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13, COLOR_WARM_PAPER)
    add_header(s13, "Infrastructure", "Container Architecture & Deployment Topology", "Two decoupled Docker Compose stacks operating identically on single or multi-VPS hosts.")

    add_card(s13, PptxInches(0.60), PptxInches(1.55), PptxInches(4.25), PptxInches(3.30), "Central Identity Stack (podium-auth)", [
        "Four dedicated containers providing edge routing and identity federation:",
        "• auth-caddy: Edge gateway managing automatic TLS termination and root reverse proxy routing.",
        "• zitadel: ZITADEL v4 enterprise identity broker handling OIDC/SAML token issuance.",
        "• zitadel-login: High-performance Login v2 user interface for authentication flows.",
        "• auth-postgres: Dedicated PostgreSQL 16 database storing ZITADEL identity events.",
        "Topology Flexibility: Operates co-located with project stacks on a single VPS or independently on a centralized identity server."
    ])

    add_card(s13, PptxInches(5.15), PptxInches(1.55), PptxInches(4.25), PptxInches(3.30), "Per-Project Stack (podium-project<N>)", [
        "Eight decoupled containers running the modular monolith application:",
        "• api: Unified Fastify backend mounting Shell, Layer, Pulse, Monitor, and Crew.",
        "• postgres: PostgreSQL 16 database with WAL archiving and schema-per-module isolation.",
        "• pgbackrest: High-speed backup sidecar executing continuous WAL archiving and restore drills.",
        "• redis: In-memory store handling session pub/sub and sub-second instant revocation.",
        "• worker: Asynchronous background worker draining outbox events and notification jobs.",
        "• layer-pipeline: 9-stage PyMuPDF vector ingestion engine for architectural drawings.",
        "• metabase: Business intelligence dashboards for read-only analytics and operational reports.",
        "• migrate: One-shot schema migration runner verifying database health at boot."
    ])

    # ==================== SLIDE 14: RELIABILITY, SECURITY & ECONOMICS ====================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14, COLOR_WARM_PAPER)
    add_header(s14, "Specifications", "Reliability, Security Controls & Economics", "Engineered for high-availability tournament operations within modest municipal budgets.")

    cards_s14 = [
        ("<5 Minutes RPO", ["Continuous PostgreSQL WAL archiving paired with pgBackRest.", "Point-in-time recovery ensures minimal data loss even in catastrophic server failure."]),
        ("$30 to $80 / Month", ["Runs reliably on a single standard Ubuntu virtual server (4 vCPU / 16 GB RAM).", "Eliminates expensive cloud database services and managed SaaS fees."]),
        ("100% Open Source", ["Zero proprietary cloud-provider SDKs or vendor locks.", "Deployable on AWS, Azure, Hetzner, OVH, or customer on-premises bare metal."]),
        ("<1 Hour Deployment", ["Fully automated environment provisioning via Docker Compose runbooks.", "Includes automated database seeding, health checks, and TLS certificate issuance."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s14):
        add_card(s14, PptxInches(0.60 + idx * 2.25), PptxInches(1.55), PptxInches(2.05), PptxInches(3.30), c_title, c_body, accent_title=True)

    # ==================== SLIDE 15: CONCLUSION & NEXT STEPS ====================
    s15 = prs.slides.add_slide(blank_layout)
    set_slide_background(s15, COLOR_WARM_PAPER)
    add_header(s15, "Operational Readiness", "Ready to Transform Venue Operations", "Proven engineering, comprehensive documentation, and direct operational clarity.")

    cards_s15 = [
        ("Field-Proven Usability", ["Continuous CAD floor plans on mobile tablets.", "Mobile venue cockpits putting VTIP/VROS tasks in technicians' hands.", "Accurate shift coverage heatmaps that prevent unmanned positions."]),
        ("Enterprise Governance", ["Central identity federation with Microsoft Entra ID and Google Workspace.", "Sub-second session revocation cutting lost devices instantly.", "Tamper-proof append-only audit trail logging every write."]),
        ("Complete Data Ownership", ["Dedicated customer deployment with isolated database.", "100% host-nation data sovereignty.", "Direct end-of-event database handover without proprietary locks."]),
    ]
    for idx, (c_title, c_body) in enumerate(cards_s15):
        add_card(s15, PptxInches(0.60 + idx * 3.00), PptxInches(1.55), PptxInches(2.80), PptxInches(2.80), c_title, c_body, accent_title=True)

    add_footer_banner(s15, PptxInches(0.60), PptxInches(4.50), PptxInches(8.80), PptxInches(0.48), "Explore Comprehensive Documentation: docs/00.INDEX.md | docs/03.REQUIREMENTS.md | docs/06.DECISIONS.md | docs/15.STORYTELLING.md")

    # Enforce zero-collision layout invariant before saving
    verify_no_pptx_collisions(prs)
    print("  [OK] Verified zero-overlap layout invariant across all 15 slides")

    prs.save(pptx_path)
    print(f"[PPTX] Successfully saved: {pptx_path}\n")


def main():
    if not os.path.exists(DOCX_PATH):
        print(f"Error: {DOCX_PATH} not found")
        sys.exit(1)
    if not os.path.exists(PPTX_PATH):
        print(f"Error: {PPTX_PATH} not found")
        sys.exit(1)

    sync_docx(DOCX_PATH)
    sync_pptx(PPTX_PATH)
    print("All Office documents synchronized successfully!")


if __name__ == "__main__":
    main()
