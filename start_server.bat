@echo off
echo Installing dependencies if missing...
pip install -r backend/requirements.txt

echo Setting up database...
cd database
python setup_db.py

echo Checking for data migration...
python migrate.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Database migration failed. 
    echo Please make sure MySQL is running and you have created the 'eduquest' database.
    echo Check the error message above for details.
    cd ..
    pause
    exit /b
)
cd ..

echo Starting EduQuest Backend...
cd backend
python app.py
pause
