function checkData(storeName, id) {
    return new Promise((resolve, reject) => {
        databasePromise(idb)
            .then((db) => {
                const tx = db.transaction(storeName, "readonly");
                const store = tx.objectStore(storeName);
                return store.get(id);
            })
            .then((data) => {
                if (data != undefined) {
                    resolve("Favourite Data")
                } else {
                    reject("Not Favourite Data")
                }
            });
    });
}


const deleteFav = (storeName, data) => {
    databasePromise(idb).then((db) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(data);
        return tx.complete;
    }).then(() => {
        console.log('Item deleted');
        document.getElementById("iconFav").innerHTML = "favorite_border";
        M.toast({
            html: 'Faourite Data Deleted Successfully'
        });
    }).catch(function () {
        M.toast({
            html: 'Error!!'
        });
    });
}

const createDataFav = (dataType, data) => {
    const storeName = "";
    const dataToCreate = {}
    if (dataType == "Team") {
        storeName = "Fav_Team"
        dataToCreate = {
            id: data.id,
            name: data.name,
            shortName: data.shortName,
            tla: data.tla,
            crestUrl: data.crestUrl,
            address: data.address,
            phone: data.phone,
            website: data.website,
            email: data.email,
            founded: data.founded,
            clubColors: data.clubColors,
            venue: data.venue,
            squad: data.squad
        }
    } else if (dataType == "Matches") {
        storeName = "Fav_Matches"
        dataToCreate = {
            id: data.match.id,
            head2head: {
                numberOfMatches: data.head2head.numberOfMatches,
                totalGoals: data.head2head.totalGoals,
                homeTeam: {
                    wins: data.head2head.homeTeam.wins,
                    draws: data.head2head.homeTeam.draws,
                    losses: data.head2head.homeTeam.losses
                },
                awayTeam: {
                    wins: data.head2head.awayTeam.wins,
                    draws: data.head2head.awayTeam.draws,
                    losses: data.head2head.awayTeam.losses
                }
            },
            match: {
                utcDate: data.match.utcDate,
                venue: data.match.venue,
                matchday: data.match.matchday,
                homeTeam: {
                    name: data.match.homeTeam.name
                },
                awayTeam: {
                    name: data.match.awayTeam.name
                }
            }
        }
    }

    console.log("data " + dataToCreate);
    databasePromise(idb).then(db => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(dataToCreate);

        return tx.complete;
    }).then(() => {
        console.log('Team Saved Successfully.');
        document.getElementById("iconFav").innerHTML = "favourite";
        M.toast({
            html: 'Data Favourited Successfully!'
        });
    }).catch(function () {
        M.toast({
            html: 'Error!'
        });
    });

}

function getSavedDataById(dataType) {
    var urlParams = new URLSearchParams(window.location.search);
    var idParam = Number(urlParams.get("id"));

    if (dataType == "Team") {
        var dataSquadHTML = ''
        var tabelSquadHTML = ''
        getDataById("Fav_Team", idParam).then((team) => {
            console.dir("getSavedTeamById: " + team);
            resultDetailTimJSON(team)
            dataTeamJSON = team;
            team.squad.forEach((squad) => {
                dataSquadJSON = squad;
                console.log("getSavedTeamById check squad name: " + squad.name);
                console.log("getSavedTeamById check squad position: " + squad.position);
                dataSquadHTML += `
         <tr>
           <td >
           <a href="./detailplayer.html?id=${squad.id}"> ${squad.name}</a>
           </td>
           <td >${squad.position}</td>
         </tr>
        `
            });
            tabelSquadHTML += `<table> <tbody> ${dataSquadHTML}  </tbody> </table>`

            document.getElementById("squad").innerHTML = tabelSquadHTML;
        })
    } else if (dataType == "Matches") {
        getDataById("Fav_Matches", idParam).then((match) => {
            resultDetailMatchJSON(match);
        });
    }
}

const getDataById = (storeName, id) => {
    return new Promise((resolve, reject) => {
        databasePromise(idb)
            .then((db) => {
                var tx = db.transaction(storeName, "readonly");
                var store = tx.objectStore(storeName);
                return store.get(id);
            })
            .then((data) => {
                resolve(data);
            });
    });
}

const getAllData = (storeName) => {
    return new Promise((resolve, reject) => {
        databasePromise(idb)
            .then((db) => {
                const tx = db.transaction(storeName, "readonly");
                const store = tx.objectStore(storeName);
                return store.getAll();
            })
            .then(function (data) {
                resolve(data);
            });
    });
}

const setupDataFavHtml = (dataType) => {

    if (dataType == "Team") {
        getAllData("Fav_Team").then((data) => {
            resultTeamFav(data);
        });
    } else if (dataType == "Matches") {
        getAllData("Fav_Matches").then((data) => {
            resultMatchFav(data);
        });
    }
}