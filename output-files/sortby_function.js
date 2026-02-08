
        // Sort function - Added Dec 9, 2025
        function sortBy(column) {{
            const headers = document.querySelectorAll("th.sortable");

            // Toggle direction if same column, else default to desc (except standing defaults to asc)
            if (currentSort.column === column) {{
                currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
            }} else {{
                currentSort.column = column;
                currentSort.direction = column === "standing" ? "asc" : "desc";
            }}

            // Update header classes
            headers.forEach(h => {{
                h.classList.remove("sort-asc", "sort-desc");
                if (h.dataset.sort === column) {{
                    h.classList.add(currentSort.direction === "asc" ? "sort-asc" : "sort-desc");
                }}
            }});

            // Sort the players array
            if (column === "standing") {{
                // Restore original order for standing
                players = [...originalPlayers];
                if (currentSort.direction === "desc") {{
                    players.reverse();
                }}
            }} else {{
                players.sort((a, b) => {{
                    let valA, valB;
                    switch (column) {{
                        case "name":
                            valA = a.name.toLowerCase();
                            valB = b.name.toLowerCase();
                            break;
                        case "rank":
                            valA = a.rank + a.progress;
                            valB = b.rank + b.progress;
                            break;
                        case "rp":
                            valA = a.RP;
                            valB = b.RP;
                            break;
                        case "honor":
                            valA = a.thisWeekHonor;
                            valB = b.thisWeekHonor;
                            break;
                        case "bracket":
                            const idxA = originalPlayers.findIndex(p => p.name === a.name);
                            const idxB = originalPlayers.findIndex(p => p.name === b.name);
                            valA = getBracket(idxA + 1).bracket;
                            valB = getBracket(idxB + 1).bracket;
                            break;
                        case "net":
                            const standA = originalPlayers.findIndex(p => p.name === a.name) + 1;
                            const standB = originalPlayers.findIndex(p => p.name === b.name) + 1;
                            const bracketA = getBracket(standA);
                            const bracketB = getBracket(standB);
                            const decayA = Math.round(a.RP * 0.20);
                            const decayB = Math.round(b.RP * 0.20);
                            valA = getRpGain(standA, bracketA, a.thisWeekHonor) - decayA;
                            valB = getRpGain(standB, bracketB, b.thisWeekHonor) - decayB;
                            break;
                        default:
                            valA = 0;
                            valB = 0;
                    }}

                    if (typeof valA === "string") {{
                        return currentSort.direction === "asc"
                            ? valA.localeCompare(valB)
                            : valB.localeCompare(valA);
                    }}
                    return currentSort.direction === "asc" ? valA - valB : valB - valA;
                }});
            }}

            updateTable();
        }}

