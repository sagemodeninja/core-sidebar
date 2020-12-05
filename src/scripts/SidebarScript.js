// Transactions...
globalSidebar.addLink("Transactions", "Instruction", "instruction.html");
globalSidebar.addLink("Transactions", "Enrollment", "enrollment.html");

// Reports...
for(var i=1; i <= 4; i++) {
    globalSidebar.addLink("Reports", `Report ${i}`, `report_${i}.html`);
}

globalSidebar.draw();