document.addEventListener('DOMContentLoaded', generateCalendar());

// GERAR MES ATUAL (TESTE A SER RETIRADO)

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
	  greeting.textContent = `Bom dia, ${name}!`;
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

})

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
	const contentMeter = document.getElementById("contentMeter");
	contentMeter.value = localStorage.getItem("contentCount");

	const codingMeter = document.getElementById("codingMeter");
	codingMeter.value = localStorage.getItem("codingCount")
/*
	const standupMeter = document.getElementById("standupMeter");
	standupMeter.value = localStorage.getItem("standupCount");
*/
	const fitnessMeter = document.getElementById("fitnessMeter");
	fitnessMeter.value = localStorage.getItem("fitnessCount");
});

function skillClick(skillUp) {
	 startTimer(25, function(){
		skillUp();
		startTimer(5);
	 });
};



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



function codingXp(){ 


	if (localStorage.getItem("codingCount") === null || localStorage.getItem("codingCount") === undefined) {
		let codingCount = 1;
		localStorage.setItem("codingCount", codingCount);
	        codingMeter.value = codingCount;
	} else {
		const originalCount = localStorage.getItem("codingCount");
		let codingCount = originalCount;
		codingCount++;
		localStorage.setItem("codingCount", codingCount);
		codingMeter.value = codingCount;
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
    '2': 'clouds'
  };

  const chosenWallp = wallp.value;
  const backgroundImage = document.getElementById("bgContainer");
	backgroundImage.style.backgroundImage = `url("./imagens/${wallpsPairs[chosenWallp]}.png")`;


});

function hideAppMenu2() {
  const appMenu = document.getElementById("appMenu");

	appMenu.style.display = 'none';
}




 
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
