document.addEventListener('DOMContentLoaded', generateCalendar());

// GERAR MES ATUAL

document.addEventListener('DOMContentLoaded', function() {
    const date = new Date();
    const month = date.getMonth();
    generateCalendar(2024, month);

});


// BEM VINDAS PERSONALIZADAS EM RELAÇÃO A HORA E AO DIA (RESPECTIVAMENTE)

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const hour = today.getHours();
    const greeting = document.querySelector('h1');

    if (!localStorage.getItem('name')) {
      const name = prompt("Insira seu nome:");
      localStorage.setItem('name', name);
    }
    
    const name = localStorage.getItem('name');
  
    if (hour >= 5 && hour < 12) {
      greeting.textContent = `Bom dia, ${name}!`;
    } else if (hour >= 12 && hour < 18) {
      greeting.textContent = `Boa tarde, ${name}!`;
    } else if (hour > 23 || hour < 5 ){
      greeting.textContent = `Boa madrugada, ${name}!`;
    } else {
	  greeting.textContent = `Boa noite, ${name}!`;
    }
  }
  );

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const miniGreetings = document.querySelector('h3');
	
	const options = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	  };

	const dayOfYear = today.toLocaleDateString('pt-BR', options);
    miniGreetings.textContent = `hoje é ${dayOfYear}`;
	
  });


// PAPEL DE PAREDE GERADO DE ACORDO COM O MÊS

document.addEventListener('DOMContentLoaded', function(){
	if (!localStorage.getItem('wallp')) {	

	const date = new Date();
	const month = date.getMonth();
	
	const months = {
		"0": "janeiro",
		"1": "fevereiro",
		"2": "marco",
		"3": "abril",
		"4": "maio",
		"5": "junho",
		"6": "julho",
		"7": "agosto",
		"8": "setembro",
		"9": "outubro",
		"10": "novembro",
		"11": "dezembro",
	}

	const backgroundImage = document.getElementById("bgContainer");
	backgroundImage.style.backgroundImage = `url("./imagens/wallps/${months[month]}.jpg")`;
	} else { 
	const backgroundImage = document.getElementById("bgContainer");
	backgroundImage.style.backgroundImage = localStorage.getItem('wallp')}
});

function removeWallp() {
	localStorage.removeItem('wallp');
};


// RELÓGIO

function updateClock() {
	const now = new Date();
	const hours = now.getHours().toString().padStart(2,'0');
	const minutes = now.getMinutes().toString().padStart(2,'0');
	const seconds = now.getSeconds().toString().padStart(2, '0');

	document.getElementById('hours').textContent = ` ${hours}:`;
	document.getElementById('minutes').textContent = `${minutes}:`;
	document.getElementById('seconds').textContent = seconds;
}

//CALL ONCE TO UPDATE WHEN PAGE LOADS
updateClock();

//CALL EVERY 20SECS TO UPDATE
setInterval(updateClock, 1000);


/*

// GERADOR DE SEMANA
document.addEventListener('DOMContentLoaded', function() {
    const currentDate = new Date();
    const currentWeek = getWeekNumber(currentDate);
    document.getElementById('currentWeek').textContent = `Week ${currentWeek}/52`;
   
	const weekGraph = document.getElementById('weekGraph');
	const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
  
    // Create table header (days of the week)
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const headerRow = document.createElement('tr');
    daysOfWeek.forEach(day => {
      const th = document.createElement('th');
      th.textContent = day;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Create table body (dates of the current week)
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Get the first day of the week (Sunday)
    for (let i = 0; i < 1; i++) { // Only one row for the current week
      const tr = document.createElement('tr');
      for (let j = 0; j < 7; j++) {
        const td = document.createElement('td');
        const day = new Date(firstDayOfWeek);
        day.setDate(firstDayOfWeek.getDate() + j);
        td.textContent = day.getDate();
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    weekGraph.appendChild(table);
    
  });
*/

  


function getWeekNumber(date) {
	const startOfYear = new Date(date.getUTCFullYear(), 0, 1);
	const daysDifference = Math.floor((date - startOfYear) / 86400000);
	const weekNumber = Math.floor((daysDifference + startOfYear.getUTCDay() + 1) / 7) + 1;
	return weekNumber;
}
  
  
// TO DO LIST

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');
    const task = taskInput.value;
  
    if (task) {
      const li = document.createElement('li');
      li.appendChild(document.createTextNode(`>  ${task}`));
      
      const deleteButton = document.createElement('button');
      deleteButton.appendChild(document.createTextNode('x'));
      deleteButton.onclick = function() {
        taskList.removeChild(li);
        removeTaskFromLocalStorage(task);
      };
      
      li.appendChild(deleteButton);
      taskList.appendChild(li);
      taskInput.value = '';
  
      saveTaskToLocalStorage(task);
    }
  }
  
  function saveTaskToLocalStorage(task) {
    let tasks;
    if (localStorage.getItem('tasks') === null) {
      tasks = [];
    } else {
      tasks = JSON.parse(localStorage.getItem('tasks'));
    }
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
  
  function removeTaskFromLocalStorage(task) {
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    tasks = tasks.filter(item => item !== task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    let tasks;
    if (localStorage.getItem('tasks') === null) {
      tasks = [];
    } else {
      tasks = JSON.parse(localStorage.getItem('tasks'));
    }
    tasks.forEach(function(task) {
      const li = document.createElement('li');
      li.appendChild(document.createTextNode(`>  ${task}`));
      
      const deleteButton = document.createElement('button');
      deleteButton.appendChild(document.createTextNode('x'));
      deleteButton.onclick = function() {
        taskList.removeChild(li);
        removeTaskFromLocalStorage(task);
      };
      
      li.appendChild(deleteButton);
      document.getElementById('taskList').appendChild(li);
    });
  });

// REC LIST

function addRec() {
  const recInput = document.getElementById('recInput');
  const recList = document.getElementById('recList');
  const rec = recInput.value;

  if (rec) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(`>  ${rec}`));
    
    const deleteButton = document.createElement('button');
    deleteButton.appendChild(document.createTextNode('x'));
    deleteButton.onclick = function() {
      recList.removeChild(li);
      removeRecFromLocalStorage(rec);
    };
    
    li.appendChild(deleteButton);
    recList.appendChild(li);
    recInput.value = '';

    saveRecToLocalStorage(rec);
  }
}

function saveRecToLocalStorage(rec) {
  let recs;
  if (localStorage.getItem('recs') === null) {
    recs = [];
  } else {
    recs = JSON.parse(localStorage.getItem('recs'));
  }
  recs.push(rec);
  localStorage.setItem('recs', JSON.stringify(recs));
}

function removeRecFromLocalStorage(rec) {
  let recs = JSON.parse(localStorage.getItem('recs'));
  recs = recs.filter(item => item !== rec);
  localStorage.setItem('recs', JSON.stringify(recs));
}

document.addEventListener('DOMContentLoaded', function() {
  let recs;
  if (localStorage.getItem('recs') === null) {
    recs = [];
  } else {
    recs = JSON.parse(localStorage.getItem('recs'));
  }
  recs.forEach(function(rec) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(`>  ${rec}`));
    
    const deleteButton = document.createElement('button');
    deleteButton.appendChild(document.createTextNode('x'));
    deleteButton.onclick = function() {
      recList.removeChild(li);
      removeRecFromLocalStorage(rec);
    };
    
    li.appendChild(deleteButton);
    document.getElementById('recList').appendChild(li);
  });
});

// NEXT FEATURES

function addFeature() {
  const featureInput = document.getElementById('featureInput');
  const featureList = document.getElementById('featureList');
  const feature = featureInput.value;

  if (feature) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(`>  ${feature}`));
    
    const deleteButton = document.createElement('button');
    deleteButton.appendChild(document.createTextNode('x'));
    deleteButton.onclick = function() {
      featureList.removeChild(li);
      removeFeatureFromLocalStorage(feature);
    };
    
    li.appendChild(deleteButton);
    featureList.appendChild(li);
    featureInput.value = '';

    saveFeatureToLocalStorage(feature);
  }
}

function saveFeatureToLocalStorage(feature) {
  let features;
  if (localStorage.getItem('features') === null) {
    features = [];
  } else {
    features = JSON.parse(localStorage.getItem('features'));
  }
  features.push(feature);
  localStorage.setItem('features', JSON.stringify(features));
}

function removeFeatureFromLocalStorage(feature) {
  let features = JSON.parse(localStorage.getItem('features'));
  features = features.filter(item => item !== feature);
  localStorage.setItem('features', JSON.stringify(features));
}

document.addEventListener('DOMContentLoaded', function() {
  let features;
  if (localStorage.getItem('features') === null) {
    features = [];
  } else {
    features = JSON.parse(localStorage.getItem('features'));
  }
  features.forEach(function(feature) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(`>  ${feature}`));
    
    const deleteButton = document.createElement('button');
    deleteButton.appendChild(document.createTextNode('x'));
    deleteButton.onclick = function() {
      featureList.removeChild(li);
      removeFeatureFromLocalStorage(feature);
    };
    
    li.appendChild(deleteButton);
    document.getElementById('featureList').appendChild(li);
  });
});



// POMODORO

let timer;
let timeLeft = 25 * 60; // Default to Pomodoro duration

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer(duration, callback) {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    timeLeft = duration * 60;
    updateTimerDisplay();
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timer);
            timer = null;
            // Play alarm sound
            playAlarmSound();
            alert(`Timer complete! (${duration} minutes)`);

			if (callback) {
				 callback();
			}
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timer);
    timer = null;
    timeLeft = 25 * 60; // Default to Pomodoro duration
    updateTimerDisplay();
}

function playAlarmSound() {
    const audio = new Audio('/home/illan/Music/victory1.mp3'); // Replace with your sound file
    audio.play();
}

updateTimerDisplay(); // Initial display

// PROJECTS METERS UPDATE

document.addEventListener('DOMContentLoaded', function() {

	const codingMeter = document.getElementById("codingMeter");
	const codingCount = codingMeter.value = localStorage.getItem("codingCount")
	
	const fitnessMeter = document.getElementById("fitnessMeter");
	const fitCount = fitnessMeter.value = localStorage.getItem("fitnessCount");
	
	const totalCount1 = document.getElementById("codingTotalCount");
	totalCount1.textContent = codingCount;
	
	const totalCount2 = document.getElementById("fitnessTotalCount");
	totalCount2.textContent = fitCount;
	
	const lvlCount1 = document.getElementById('lvl1');
	lvl1.textContent = getLevel(codingCount);

	const lvlCount2 = document.getElementById('lvl2');
	lvl2.textContent = getLevel(fitCount);
	
	codingMeter.max = getLevelMax(codingCount);
	fitnessMeter.max = getLevelMax(fitCount);

function getLevel(skillCount) {
    
    // Define the thresholds for each level
    const thresholds = [3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047];
    // Loop through the thresholds to find the appropriate level
    for (let level = 0; level < thresholds.length; level++) {
        if (skillCount <= thresholds[level]) {
            return level + 2;
        }
    }
    
    // If skillCount exceeds the last threshold, return the maximum level 10
    return 10;
};

function getLevelMax(skillCount) {

    // Define the thresholds for each level
    const thresholds = [3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047];
   for (let level = 0; level < thresholds.length; level++) {
       if (skillCount <= thresholds[level]) {
	   return thresholds[level];
	}		 
   }
};

});

function fitnessXp(){ 

	if (localStorage.getItem("fitnessCount") === null || localStorage.getItem("fitnessCount") === undefined) {
		let fitnessCount = 1;
		localStorage.setItem("fitnessCount", fitnessCount);
	        fitnessMeter.value = fitnessCount;
	} else {
		const originalCount = localStorage.getItem("fitnessCount");
		let fitnessCount = originalCount;
		fitnessCount++;
		localStorage.setItem("fitnessCount", fitnessCount);
		fitnessMeter.value = fitnessCount;
	}

};



function upXp(skill){ 
	if (localStorage.getItem(skill + "Count") === null || localStorage.getItem(skill + "Count") === undefined) {
		let Count= 1;
        	localStorage.setItem(skill + "Count", Count);
	        codingMeter.value = Count;
		const xpTotal = document.getElementById(skill + "TotalCount");
		xpTotal.textContent = `${Count}`;
	} else {
		const originalCount = localStorage.getItem(skill +"Count");
		let Count = originalCount;
		Count++;
		localStorage.setItem(skill + "Count", Count);
		codingMeter.value = Count;
		const xpTotal = document.getElementById(skill + "TotalCount");
		xpTotal.textContent = `${Count}`;
	}

};

function contentXp(){ 

	if (localStorage.getItem("contentCount") === null || localStorage.getItem("contentCount") === undefined) {
		let contentCount = 1;
		localStorage.setItem("contentCount", contentCount);
		contentMeter.value = contentCount;
	} else {
		const originalCount = localStorage.getItem("contentCount");
		let contentCount = originalCount;
		contentCount++;
		localStorage.setItem("contentCount", contentCount);
		contentMeter.value = contentCount;
	}

};
/*
// TASKLIST  - WORK IN PROGRESS WIP

document.addEventListener('DOMContentLoaded', () => {

	const taskcheck1 = document.getElementById('task1');
	const taskcheck3 = document.getElementById('task3');
	const taskcheck4 = document.getElementById('task4');
	const taskcheck5 = document.getElementById('task5');
	const taskcheck6 = document.getElementById('task6');
	const taskcheck7 = document.getElementById('task7');	
	const taskcheck8 = document.getElementById('task8');
	const taskcheck9 = document.getElementById('task9');
	const taskcheck10 = document.getElementById('task10');
	const taskcheck11 = document.getElementById('task11');
	const taskcheck12 = document.getElementById('task12');
	
	let i = 1;
	if (localStorage.getItem('todaytasks')) {
		let tasksChecked = JSON.parse(localStorage.getItem('todaytasks'));
		tasksChecked = tasks.filter(item => item.checked = true);
		
	}
});


function loadDailies(tasklist) {
    let taskslist = JSON.parse(localStorage.getItem('tasklist'));
     

	tasks = tasks.filter(item => item !== task);

    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
 */ 
// DRAGABLE FUNCTION (cp from https://jsfiddle.net/4t3Ju/)

window.onload = function() {
	draggable('skillsContainer');
	draggable('pomodoro');
	draggable('dailiesContainer');
	draggable('todoContainer');
	draggable('recContainer');
	draggable('calendarContainer');
	draggable('wallpContainer');
	draggable('calcContainer');
        draggable('workoutContainer');
	draggable('nextFeatures');
};

var dragObj = null;
function draggable(id) {
		var obj = document.getElementById(id);
		obj.style.position = 'absolute';
		obj.onmousedown = function() {
				dragObj = obj;
		}
}

document.onmouseup = function(e){
		dragObj = null;
};

document.onmousemove = function(e){
		var x = e.pageX;
		var y = e.pageY;
		
//disabled text selection to disable unexpected behavior while dragging

		const selection = document.getSelection();
		selection.empty();

		if(dragObj == null)
			return;
		dragObj.style.left = x +"px";
		dragObj.style.top = y +"px";
};

// APP MENU (START BUTTON)
	
document.addEventListener('DOMContentLoaded', hideAppMenu);


function hideAppMenu() {
	const appMenu = document.getElementById("appMenu");

	appMenu.style.display = (appMenu.style.display === 'none') ? 'block' : 'none';
	appMenu.style.position = 'absolute';
	appMenu.style.bottom = '22px';
	appMenu.style.left = '-12px';
}

function clickStart() {
  
  const startBtn = document.getElementById("startBtn");

  if (startBtn.style.borderWidth) {
    startBtn.style = '';
  } else {

  startBtn.style.borderWidth = '2px';
  startBtn.style.borderRightColor = '#EEEEEE';
  startBtn.style.borderLeftColor = '#222222';
  startBtn.style.borderBottomColor = '#EEEEEE';
  startBtn.style.borderTopColor = '#222222';
  }
}

function hideQuadro(idQuadro) {
  const quadro = document.getElementById(`${idQuadro}`);
  quadro.style.display = (quadro.style.display === 'none') ? 'block' : 'none';

}



// CALENDAR GENERATOR

function generateCalendar() {
  // Get the current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  //DEFINE MONTH TITLE
  const monthTitle = document.getElementById('calendarTitle');
  const options = {
    year: 'numeric',
    month: 'long'
  }

  const monthAndYear = currentDate.toLocaleDateString('pt-BR', options);
  monthTitle.textContent = `Calendário: ${monthAndYear}`;

  // Get the first day and last day of the month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // Create the table element
  const table = document.createElement("table");
  table.id = "calendar";

  // Create the header row with day names
  const headerRow = table.insertRow();
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  daysOfWeek.forEach(day => {
      const th = document.createElement("th");
      th.textContent = day;
      headerRow.appendChild(th);
  });

  // Determine the starting day of the month
  const startDay = firstDay.getDay();

  // Create the days of the month
  let currentDatePointer = new Date(firstDay);
  currentDatePointer.setDate(1 - startDay); // Adjust to the starting day

  while (currentDatePointer <= lastDay) {
      const row = table.insertRow();

      for (let i = 0; i < 7; i++) {
          const cell = row.insertCell();
          if (currentDatePointer.getMonth() === currentMonth) {
              cell.textContent = currentDatePointer.getDate();
              cell.id = `dia${currentDatePointer.getDate()}`;
          }
          currentDatePointer.setDate(currentDatePointer.getDate() + 1);
      }
  }
  // Append the table to the calendarContainer div
  const weekGraph = document.getElementById("weekGraph");
  weekGraph.innerHTML = "";
  weekGraph.appendChild(table);
}


// CALCULATOR
function toDisplay(value) {
  document.getElementById('display').value = value;
}

function appendToDisplay(value) {
  document.getElementById('display').value += value;
}

function clearDisplay() {
  document.getElementById('display').value = '';
}

function calculate() {
  try {
    document.getElementById('display').value = eval(document.getElementById('display').value);
  } catch (error) {
    document.getElementById('display').value = 'Error';
  }
}

const wallp = document.getElementById("selectWallp");

wallp.addEventListener('change', () => {
 
  const wallpsPairs = {
    '0': 'windowsgreen',
    '1': '98color',
    '2': 'clouds',
    '3': 'janeiro',
    '4': 'fevereiro',
    '5': 'marco',
    '6': 'abril',
    '7': 'maio',
    '8': 'junho',
    '9': 'julho',
    '10': 'agosto',
    '11': 'setembro',
    '12': 'outubro',
    '13': 'novembro',
    '14': 'dezembro'
  };

  const chosenWallp = wallp.value;
  const backgroundImage = document.getElementById("bgContainer");
  const wallpSelected = backgroundImage.style.backgroundImage = `url("./imagens/${wallpsPairs[chosenWallp]}.jpg")`;

  localStorage.setItem('wallp', wallpSelected);

});

function hideAppMenu2() {
  const appMenu = document.getElementById("appMenu");

	appMenu.style.display = 'none';
}



// Function to add a daily task
function addDaily() {
    const dailyInput = document.getElementById('dailyInput').value;  // Get the input text
    if (dailyInput) {  // Check if input is not empty
        // Retrieve the existing dailies from localStorage
        let dailies = JSON.parse(localStorage.getItem('dailiesList')) || [];

        // Add the new daily task to the array
        dailies.push(dailyInput);

        // Save the updated array back to localStorage
        localStorage.setItem('dailiesList', JSON.stringify(dailies));

        // Render the updated dailies list
        renderDailies();

        // Clear the input field
        document.getElementById('dailyInput').value = '';
    }
}

// Function to remove a daily task
function removeDaily(index) {
    // Retrieve the existing dailies from localStorage
    let dailies = JSON.parse(localStorage.getItem('dailiesList')) || [];

    // Remove the task at the specified index
    dailies.splice(index, 1);

    // Save the updated array back to localStorage
    localStorage.setItem('dailiesList', JSON.stringify(dailies));

    // Render the updated dailies list
    renderDailies();
}

// Function to render the dailies list
function renderDailies() {
    const dailiesList = document.getElementById('dailiesList');
    dailiesList.innerHTML = '';  // Clear the current list

    // Retrieve the existing dailies from localStorage
    let dailies = JSON.parse(localStorage.getItem('dailiesList')) || [];

    // Loop through the dailies array and create the list items
    dailies.forEach((daily, index) => {
        let li = document.createElement('li');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';


    // Create a remove button for each daily
    let removeButton = document.createElement('button');
    removeButton.innerText = 'x';
    removeButton.onclick = function() { removeDaily(index); };

        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(daily));
	li.appendChild(removeButton);
        dailiesList.appendChild(li);
    });
}

// Call renderDailies on page load to display any existing dailies
document.addEventListener('DOMContentLoaded', renderDailies);

/*DRAFT OF GENERIC FUNCTION FOR UP SKIL

function skillUpXp(skill){ 
	startTimer(2, function(skill) {

	if (localStorage.getItem(`${skill} + Count`) === null || localStorage.getItem(`${skill} + Count`) === undefined) {
		let skillCount = 1;
		localStorage.setItem(`${skill} + Count`, skillCount);
	        contentMeter.value = skillCount;
	} else {
		const originalCount = localStorage.getItem(`${skill} + Count`);
		let skillCount = originalCount;
		skillCount++;
		localStorage.setItem(`${skill} + Count`, skillCount);
		contentMeter.value = skillCount;
	}
});

};
*/ 

document.addEventListener('DOMContentLoaded', function() {
  // Initialize board and daily counter for each skill
  initializeBoard('coding');
  updateDailyCounter('coding');
  initializeBoard('fitness');
  updateDailyCounter('fitness');
  // Add similar calls for other skills like 'physical', etc.
});

function initializeBoard(skill) {
  const board = document.getElementById(skill + 'Board');
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const boardState = JSON.parse(localStorage.getItem(skill + 'BoardState')) || {};
  const button = document.getElementById(skill+'Btn');

  button.addEventListener('click', function() {
      const today = new Date().getDate();
      incrementDayCount(skill, today);
  });
 
for (let day = 1; day <= daysInMonth; day++) {
    const square = document.createElement('div');
    square.classList.add('day-square');
    square.dataset.day = day;
    square.dataset.count = boardState[day] || 0;
    square.textContent = square.dataset.count;
    square.style.backgroundColor = `rgba(0, 255, 0, ${square.dataset.count * 0.1})`;  // Adjust color intensity
    board.appendChild(square);
  }
}

function incrementDayCount(skill, day) {
  const square = document.querySelector(`#${skill}Board div[data-day='${day}']`);
  let count = parseInt(square.dataset.count) || 0;
  startTimer(25);
  count++;
  square.dataset.count = count;
  square.style.backgroundColor = `rgba(0, 255, 0, ${count * 0.1})`;  // Adjust color based on count
  saveBoardState(skill, day, count);
  updateDailyCounter(skill);  // Update the daily counter after each click
  upXp(skill);  
}

function saveBoardState(skill, day, count) {
  const boardState = JSON.parse(localStorage.getItem(skill + 'BoardState')) || {};
  boardState[day] = count;
  localStorage.setItem(skill + 'BoardState', JSON.stringify(boardState));
}

function updateDailyCounter(skill) {
  const dailyCountElement = document.getElementById('dailyCount' + skill);
  let dailyCount = 0;
  const boardState = JSON.parse(localStorage.getItem(skill + 'BoardState')) || {};
  const today = new Date().getDate();

  if (boardState[today]) {
    dailyCount = boardState[today];
  }

  dailyCountElement.textContent = dailyCount;
}

