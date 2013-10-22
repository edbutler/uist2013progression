Progression Design Tool
=======================

This is the code used for the project [A Mixed-Initiative Tool for Designing Level Progressions in Games](http://www.ericbutler.net/media/papers/uist2013_progression.pdf), which appeared in UIST 2013. It is not intended as a usable piece of software, but rather as reference for other systems. Meaning, it's half-functional research code with both wildly out-of-date documentation and a lot of bugs. You have been forewarned. You can see a video of a functional version [here](http://www.ericbutler.net/media/papers/uist2013_progression.mp4).

Running the Program
-------------------

The tool is a webapp backed by the Flask python web server, using answer set programming to do the heavy lifting on the backend.

Requirements:
- python and all the packages listed in `requirements.txt`.
- gringo and the disjunctive version of clasp (claspD), somewhere on the path. You can download them here, but you might have to build claspD from source: http://potassco.sourceforge.net/index.html

With those in hand, `cd html/` and run `python main.py` to launch a web server on port 5000. Navigate to [http://localhost:5000/editor/refraction]() to start the tool.

