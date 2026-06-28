import datetime
import random
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, engine, Base
from backend.app.models import Department, User, Task, Document, Meeting
from backend.app.auth import get_password_hash

def seed_db(db: Session):
    # Check if we already have departments seeded
    if db.query(Department).count() > 0:
        print("Database already seeded.")
        return

    print("Seeding database...")

    # 1. Seed Departments
    dept_names = ["HR", "Engineering", "Finance", "Operations", "Marketing"]
    depts = []
    for name in dept_names:
        dept = Department(department_name=name)
        db.add(dept)
        depts.append(dept)
    db.commit()
    # Refresh to get IDs
    for d in depts:
        db.refresh(d)

    # 2. Seed Managers (5 managers, 1 per department)
    managers = []
    manager_data = [
        {"name": "Sarah Jenkins", "email": "hr_mgr@excueai.com", "dept": "HR"},
        {"name": "David Chen", "email": "eng_mgr@excueai.com", "dept": "Engineering"},
        {"name": "Robert Miller", "email": "fin_mgr@excueai.com", "dept": "Finance"},
        {"name": "Elena Rostova", "email": "ops_mgr@excueai.com", "dept": "Operations"},
        {"name": "James Sinclair", "email": "mkt_mgr@excueai.com", "dept": "Marketing"},
    ]
    
    password_hash = get_password_hash("password123")
    
    for mgr_info in manager_data:
        dept_id = next(d.department_id for d in depts if d.department_name == mgr_info["dept"])
        mgr = User(
            name=mgr_info["name"],
            email=mgr_info["email"],
            password_hash=password_hash,
            role="Manager",
            department_id=dept_id,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=90)
        )
        db.add(mgr)
        managers.append(mgr)
    db.commit()
    for m in managers:
        db.refresh(m)

    # 3. Seed Employees (25 employees, 5 per department)
    employees = []
    employee_names = [
        # HR Employees
        ("Alice Adams", "alice@excueai.com", "HR"),
        ("Bob Baker", "bob@excueai.com", "HR"),
        ("Charlie Carter", "charlie@excueai.com", "HR"),
        ("Diana Prince", "diana@excueai.com", "HR"),
        ("Evan Wright", "evan@excueai.com", "HR"),
        # Engineering Employees
        ("Frank Foster", "frank@excueai.com", "Engineering"),
        ("Grace Hopper", "grace@excueai.com", "Engineering"),
        ("Henry Higgins", "henry@excueai.com", "Engineering"),
        ("Ivy League", "ivy@excueai.com", "Engineering"),
        ("Jack Sparrow", "jack@excueai.com", "Engineering"),
        # Finance Employees
        ("Karen King", "karen@excueai.com", "Finance"),
        ("Leo Lion", "leo@excueai.com", "Finance"),
        ("Mona Lisa", "mona@excueai.com", "Finance"),
        ("Nathan Drake", "nathan@excueai.com", "Finance"),
        ("Olivia Wilde", "olivia@excueai.com", "Finance"),
        # Operations Employees
        ("Peter Parker", "peter@excueai.com", "Operations"),
        ("Quentin Tarantino", "quentin@excueai.com", "Operations"),
        ("Rachel Green", "rachel@excueai.com", "Operations"),
        ("Steve Rogers", "steve@excueai.com", "Operations"),
        ("Tony Stark", "tony@excueai.com", "Operations"),
        # Marketing Employees
        ("Ursula K", "ursula@excueai.com", "Marketing"),
        ("Victor Hugo", "victor@excueai.com", "Marketing"),
        ("Wendy Darling", "wendy@excueai.com", "Marketing"),
        ("Xavier Prof", "xavier@excueai.com", "Marketing"),
        ("Yolanda Young", "yolanda@excueai.com", "Marketing"),
    ]

    for name, email, dept_name in employee_names:
        dept_id = next(d.department_id for d in depts if d.department_name == dept_name)
        emp = User(
            name=name,
            email=email,
            password_hash=password_hash,
            role="Employee",
            department_id=dept_id,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=60)
        )
        db.add(emp)
        employees.append(emp)
    db.commit()
    for e in employees:
        db.refresh(e)

    # 4. Seed Tasks (100 Tasks)
    priorities = ["Low", "Medium", "High", "Critical"]
    statuses = ["Pending", "In Progress", "Completed"]
    
    task_templates = [
        ("Review HR Policies", "Review the updated employee handbook and submit confirmation.", "HR"),
        ("Conduct Performance Reviews", "Assess Q2 achievements and organize 1-on-1 calls.", "HR"),
        ("Onboard New Hires", "Complete compliance checks and system logins setup.", "HR"),
        ("Verify Benefits Enrollment", "Process benefits forms for Q3 benefits intake.", "HR"),
        ("Plan Team Building Event", "Outline budgets and coordinate location bookings.", "HR"),
        
        ("Refactor Backend Auth", "Migrate authentication flow to use faster crypt libraries.", "Engineering"),
        ("Implement Analytics Dashboard", "Create Recharts visual components for managers.", "Engineering"),
        ("Fix Memory Leak in Daemon", "Debug memory leak occurring during socket connections.", "Engineering"),
        ("Upgrade API Gateway", "Configure gateway routing tables and rates limits.", "Engineering"),
        ("Write Integration Tests", "Add endpoint integration tests covering critical API flows.", "Engineering"),
        
        ("Reconcile Accounts", "Audit the monthly operations statements and ledger entries.", "Finance"),
        ("Prepare Q3 Budget Report", "Aggregate department forecasts and assemble executive summaries.", "Finance"),
        ("Process Payroll", "Verify payroll sheets and run bank transactions transfers.", "Finance"),
        ("Analyze Expense Reports", "Identify anomalies and approve employee expense sheets.", "Finance"),
        ("Update Tax Fillings", "File corporate tax schedules for the current quarter.", "Finance"),
        
        ("Optimize Storage Logistics", "Reorganize warehouse flows to reduce picking cycle times.", "Operations"),
        ("Review Supply Chain Contracts", "Negotiate freight rates with vendor representatives.", "Operations"),
        ("Audit Safety Guidelines", "Perform safety inspections across assembly stations.", "Operations"),
        ("Track Delivery KPI Metrics", "Prepare performance charts for fulfillment pipelines.", "Operations"),
        ("Schedule Maintenance Window", "Coordinate database server reboots and backups routine.", "Operations"),
        
        ("Launch Email Campaign", "Draft creative copy and schedule marketing newsletters.", "Marketing"),
        ("Analyze SEO Performance", "Track rankings growth and keyword optimization targets.", "Marketing"),
        ("Design Promo Graphics", "Create social media visual templates for autumn launch.", "Marketing"),
        ("Coordinate Press Release", "Draft announcement for new software modules launch.", "Marketing"),
        ("Manage Ad Budgets", "Optimize bidding strategies across search engines campaigns.", "Marketing"),
    ]

    # Generate 100 tasks
    for i in range(100):
        # Pick template or generate random
        template = random.choice(task_templates)
        title = f"{template[0]} - Phase {random.randint(1, 5)}"
        description = f"{template[1]} Details: This task is part of our quarterly department targets. Please adhere to the guidelines and update status regularly."
        dept_name = template[2]
        
        # Select matching manager and employee
        dept_id = next(d.department_id for d in depts if d.department_name == dept_name)
        manager = next(m for m in managers if m.department_id == dept_id)
        
        # Pick employee in the department
        dept_employees = [e for e in employees if e.department_id == dept_id]
        employee = random.choice(dept_employees) if dept_employees else random.choice(employees)
        
        # Set realistic deadlines
        days_offset = random.randint(-15, 30)
        deadline = datetime.date.today() + datetime.timedelta(days=days_offset)
        
        # Set logical status & creation dates
        status = random.choice(statuses)
        if days_offset < 0 and status != "Completed":
            # If deadline has passed, mostly make it completed or high priority
            status = random.choice(["Completed", "In Progress"])
            
        priority = random.choice(priorities)
        if status == "Completed":
            created_offset = random.randint(10, 30)
        else:
            created_offset = random.randint(1, 10)
            
        created_at = datetime.datetime.utcnow() - datetime.timedelta(days=created_offset)
        
        task = Task(
            title=title,
            description=description,
            priority=priority,
            status=status,
            deadline=deadline,
            assigned_employee_id=employee.user_id,
            created_by_manager_id=manager.user_id,
            created_at=created_at
        )
        db.add(task)
    db.commit()

    # 5. Seed Documents Metadata (20 Documents)
    doc_categories = ["HR", "Engineering", "Finance", "Operations", "Marketing"]
    doc_titles = [
        "Employee Handbook 2026.pdf",
        "Standard Leave Policy.docx",
        "HR Guidelines for Managers.pdf",
        "Engineering SOP v4.pdf",
        "Coding Style Guide.txt",
        "Q3 Budget Guidelines.docx",
        "Expense Reimbursement SOP.pdf",
        "Warehouse Safety Rules.pdf",
        "Inventory Flow Chart.pdf",
        "Brand Style Guide.pdf",
        "Email Marketing Guidelines.docx",
        "Security Compliance Policies.pdf",
        "Remote Work Regulations.docx",
        "Onboarding Guide for Employees.docx",
        "Disaster Recovery SOP.pdf",
        "Procurement Protocol.docx",
        "Social Media Policy.txt",
        "Product Roadmap Phase II.pdf",
        "Database Schema Reference.pdf",
        "Customer Support Operations Handbook.docx"
    ]

    for idx, title in enumerate(doc_titles):
        dept_name = doc_categories[idx % len(doc_categories)]
        dept_id = next(d.department_id for d in depts if d.department_name == dept_name)
        manager = next(m for m in managers if m.department_id == dept_id)
        
        doc = Document(
            filename=title,
            upload_date=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(5, 45)),
            uploaded_by=manager.user_id,
            file_path=f"/uploads/documents/{title}",
            vector_reference=f"doc_vec_{idx + 1}"
        )
        db.add(doc)
    db.commit()

    # 6. Seed Meetings (10 Meetings)
    meeting_titles = [
        "Weekly Engineering Sync",
        "Product Roadmap & Q3 Plan",
        "HR Policy Alignment & Benefits Review",
        "Finance Budget Q3 Forecasts Review",
        "Marketing Campaign Strategy Brainstorm",
        "Operations Logistics Audit & Optimization",
        "Board of Directors Quarterly Review",
        "Customer Feedback & Success Optimization",
        "Project Alpha Post-Mortem & Learnings",
        "Enterprise Security & Compliance Audit"
    ]
    
    meeting_transcripts = [
        # 1. Engineering Sync
        ("David: Team, let's discuss our progress. Frank, how is the backend refactoring going?\n"
         "Frank: I have migrated password hashing to standard bcrypt. Running into minor migration issues with user roles, but should resolve it by Wednesday.\n"
         "David: Good. Grace, what about the analytics UI?\n"
         "Grace: Recharts integrations are done. I am finishing the custom dashboard templates today. It looks clean and responsive.\n"
         "David: Excellent. We need to make sure backend security validates user tokens correctly. Let's write integration tests for JWT validation. Ivy, please coordinate with Frank to verify database security rules by Friday."),
        
        # 2. Product Roadmap
        ("David: Welcome everyone. Today we are aligning on the Q3 roadmap. The main focus is the AI Assistant deployment.\n"
         "Wendy: From marketing, we need a clear press kit before the launch in September.\n"
         "Robert: Do we have budget approval for the GPU clusters necessary for the model?\n"
         "David: Yes, Robert, the budget was approved yesterday. We are allocation $50k for server infrastructure.\n"
         "Peter: Operations is ready to schedule the maintenance windows for the database cluster migration next Saturday.\n"
         "David: Perfect. Action items: David to finalize technical specifications. Robert to transfer infrastructure budget. Wendy to draft press release."),
         
        # 3. HR Policy
        ("Sarah: Welcome. We are reviewing our standard leave policies today. There's been a lot of questions about parental leave.\n"
         "Alice: Right now, the policy says 12 weeks of paid leave. Some employees are requesting clarification on split leave options.\n"
         "Sarah: We will update the guidelines to allow splitting parental leave into two separate blocks within 12 months. Bob, please draft the updated SOP guidelines by next Monday.\n"
         "Charlie: We also need to distribute the updated health benefits enrollment forms.\n"
         "Sarah: Charlie, please email the benefits packet to all departments by Wednesday afternoon."),
         
        # 4. Finance Review
        ("Robert: Let's review the Q3 budget estimates. Marketing is requesting a 15% budget increase for the new campaigns.\n"
         "James: The increase is necessary to cover ad spend on new channels. We expect a 3x return in lead generation.\n"
         "Robert: I will review the metrics, but we must stay within our $200k operational limit. Let's examine department spending. Karen, please run a detailed cost comparison report by Thursday.\n"
         "Leo: Engineering and Operations expenses are stable. We might have some savings in server optimization.\n"
         "Robert: Good. Leo, compile the server cost savings report before Friday."),
         
        # 5. Marketing Brainstorm
        ("James: Team, let's brainstorm campaigns for the ExcueAI autumn launch.\n"
         "Wendy: We should focus on visual story-telling. A series of short videos showcasing automated RAG Q&A would work.\n"
         "Victor: I can write scripts for the demo videos highlighting the document comparison and report generators.\n"
         "Ursula: We must run targeted ads on tech platforms. I will research audience segments and configure ad groups.\n"
         "James: Great ideas. Victor, write the scripts by next Tuesday. Ursula, draft the ad group configs by Friday. Let's sync next Wednesday."),
         
        # 6. Operations Audit
        ("Elena: Today's focus is warehouse logistics optimization. Our picking times have increased by 12% last month.\n"
         "Peter: The delay is caused by congestion in aisle 4. We need to relocate high-frequency items closer to packing stations.\n"
         "Quentin: I can run a spatial analysis on inventory flow to map optimal placement.\n"
         "Elena: Excellent. Quentin, execute that flow study by Monday. Steve, coordinate staff shifts to assist with relocation next Thursday.\n"
         "Steve: On it. I'll prepare scheduling logs today."),
         
        # 7. Board Meeting
        ("Sarah: Thank you all for coming. Let's review Q2 highlights. We achieved a 25% growth in active accounts.\n"
         "Robert: Revenue grew by $1.2M, driven primarily by enterprise service tiers. Gross margins remain healthy at 78%.\n"
         "David: Engineering successfully launched the document parser engine, which reduced customer onboarding times by 40%.\n"
         "Elena: Operations scalability metrics show 99.98% system uptime during peak hours.\n"
         "Sarah: Outstanding results. For Q3, we must expand research into multi-agent systems. David, draft research proposal by mid-July."),
         
        # 8. Customer Success
        ("Elena: Customer satisfaction dropped slightly in June due to delayed support responses. We need to streamline support ticket routing.\n"
         "Rachel: The main bottleneck is classifying ticket intents. Our agents spend hours sorting requests.\n"
         "Elena: Let's build an AI classifier to route incoming tickets automatically. Steve, set up a meeting with David from engineering to discuss API integration by Friday.\n"
         "Rachel: In the meantime, I'll update templates for common support queries to help agents respond faster."),
         
        # 9. Project Alpha Post-Mortem
        ("David: Let's conduct the post-mortem for Project Alpha. Although we launched successfully, we missed our original deadline by three weeks.\n"
         "Grace: The primary blocker was changing requirements mid-development. We had to rewrite the analytics schemas twice.\n"
         "Frank: Additionally, local database integration testing was set up late, causing last-minute bugs.\n"
         "David: Key learnings: Requirements must be frozen before coding. Test suites must run on day one. Ivy, create a new code QA guideline document by next week."),
         
        # 10. Security Compliance
        ("David: Security compliance audit is coming up in August. We need to review all data privacy protocols.\n"
         "Ivy: Our user data is encrypted in transit and at rest, but we must verify that role permissions prevent normal users from querying database metadata.\n"
         "David: Right. Employees must only access their own records. Let's do a complete RBAC audit. Frank, write a script to check API authorization rules for all end-points by Wednesday.\n"
         "Ivy: I will review document storage encryptions and prepare compliance reports.")
    ]

    meeting_details = [
        # 1. Engineering Sync
        ("This weekly engineering meeting focused on backend refactoring, analytics UI integration, and system security. "
         "The team discussed JWT authentication validation and planned integration test coverage."),
        # 2. Product Roadmap
        ("Product roadmap alignment for Q3. Key focus areas include deploying the AI Assistant, funding infrastructure clusters, "
         "and drafting marketing kits for the product announcement."),
        # 3. HR Policy
        ("Discussion on standard leave policies. HR will update SOP guidelines to support split parental leaves. "
         "Health benefits enrollment packets will be emailed to all employees."),
        # 4. Finance Review
        ("Q3 budget review meeting. The team discussed marketing's request for a budget increase, "
         "and initiated cost comparison reviews for server resources and operational boundaries."),
        # 5. Marketing Brainstorm
        ("Autumn marketing strategy session. Planned visual story-telling demo videos, "
         "ad targeting segments for search platforms, and script writing deliverables."),
        # 6. Operations Audit
        ("Weekly warehouse logistics audit. Planned relocation of high-demand items to minimize transit times "
         "and resolved shelf congestion bottlenecks."),
        # 7. Board Meeting
        ("Quarterly board review of Q2 performance. Reconciled revenue indicators, gross margins, "
         "parser engine launch achievements, and set expectations for agent research in Q3."),
        # 8. Customer Success
        ("Customer support pipeline optimization meeting. Decided to build an automated AI ticket classifier "
         "to reduce response times and resolved classification bottlenecks."),
        # 9. Project Alpha Post-Mortem
        ("Project post-mortem highlighting learnings from Alpha release delay. Emphasized frozen requirements "
         "and early automated test suites deployment for upcoming projects."),
        # 10. Security Compliance
        ("Pre-audit security checklist sync. Tasked engineering with verification of database role-based filters "
         "and auditing of stored document files access permissions.")
    ]

    meeting_actions = [
        '["Frank: Fix database role migration issues by Wednesday", "Grace: Complete custom dashboard templates today", "Ivy: Coordinate integration tests for JWT security by Friday"]',
        '["David: Finalize roadmap technical specifications", "Robert: Transfer server cluster budget", "Wendy: Draft marketing press release"]',
        '["Bob: Draft updated parental split leave SOP by Monday", "Charlie: Send out benefits packets by Wednesday"]',
        '["Karen: Run detailed cost comparison report by Thursday", "Leo: Compile server savings projections before Friday"]',
        '["Victor: Write demo video scripts by next Tuesday", "Ursula: Draft search ad groups configs by Friday"]',
        '["Quentin: Execute inventory spatial flow study by Monday", "Steve: Coordinate staff shifts for item relocation next Thursday"]',
        '["David: Draft Q3 multi-agent system research proposal by mid-July"]',
        '["Steve: Set up API integration meeting with Engineering by Friday", "Rachel: Update templates for common tickets today"]',
        '["Ivy: Create new code QA guidelines doc by next week", "David: Implement early test suite setup rule in roadmap"]',
        '["Frank: Write API auth authorization checks script by Wednesday", "Ivy: Review document storage encryption standard by Friday"]'
    ]

    meeting_risks = [
        '["User role configuration issues might delay testing deadline", "Unauthorized API access if validation tests are incomplete"]',
        '["GPU server delays may delay September launch timeline", "Ad spend costs might exceed operational constraints"]',
        '["Parental split leave configuration might confuse team managers", "Missing health benefits filings due to late email responses"]',
        '["Marketing budget increase might impact engineering expansion", "Server cost optimizations might temporarily reduce processing capacities"]',
        '["Ad bidding costs might yield lower-than-expected conversions", "Video script revisions could delay promotional schedule"]',
        '["Staff constraints during relocation might cause packing delays", "Spatial study errors could lead to incorrect warehouse layouts"]',
        '["Multi-agent research costs might exceed preliminary Q3 funding allowances"]',
        '["Intent classification model errors might route tickets to wrong groups", "Delay in Engineering API hook could stall support dashboard roll-out"]',
        '["Requirements creep in future projects could lead to similar timeline slippages"]',
        '["Database metadata access leaks if RBAC filters are misconfigured", "Non-compliance penalty risks if audit happens prior to storage encryption check"]'
    ]

    for idx, title in enumerate(meeting_titles):
        dept_name = doc_categories[idx % len(doc_categories)]
        dept_id = next(d.department_id for d in depts if d.department_name == dept_name)
        manager = next(m for m in managers if m.department_id == dept_id)
        
        meet = Meeting(
            title=title,
            transcript=meeting_transcripts[idx],
            summary=meeting_details[idx],
            action_items=meeting_actions[idx],
            risks=meeting_risks[idx],
            upload_date=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 30)),
            uploaded_by=manager.user_id
        )
        db.add(meet)
    db.commit()

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    # Create database tables if they do not exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
