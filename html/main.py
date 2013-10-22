from __future__ import absolute_import, print_function, unicode_literals

from flask import Flask, render_template, Response, request, jsonify, send_from_directory
import solver
import concept
import json
import refraction

app = Flask(__name__)

games = {
    refraction.app.id: refraction.app
}

@app.route('/')
def base():
    return "test"

@app.route('/editor/<gname>')
def get_editor(gname):
    return render_template('editor.html', game=games[gname])

@app.route('/generator/<gname>')
def get_generator(gname):
    return render_template('generator.html', game=games[gname])

@app.route('/ctrl/<gname>/default/conceptset')
def get_concept_set(gname):
    game = games[gname]
    return jsonify(concepts=game.cset.jsonify())

@app.route('/ctrl/<gname>/default/constraints')
def get_progression_constraints(gname):
    game = games[gname]
    return jsonify(constraints=game.pcon.jsonify())

@app.route('/ctrl/<gname>/generate/progression', methods=['POST'])
def generate_progression(gname):
    game = games[gname]
    form = json.loads(request.data)
    pcon = concept.ProgressionConstraints.from_json(game.cset, form['constraints'])
    facts = game.solver.generate_progression(pcon.aspify())
    prog = concept.Progression.from_facts(game.cset, map(solver.parse_predicate, facts))
    return jsonify(progression=prog.jsonify())

@app.route('/ctrl/<gname>/generate/level', methods=['POST'])
def generate_level(gname):
    game = games[gname]
    form = json.loads(request.data)
    prog = concept.Progression.from_json(game.cset, form['progression'])
    idx = form['index']
    level = game.solver.generate_level(prog.aspify_for_level(idx))
    # on failure, return the default level instead of crashing
    if level is not None:
        return level
    else:
        return json.dumps(game.default_level)

@app.route('/ctrl/<gname>/analyze/level', methods=['POST'])
def analzye_level(gname):
    game = games[gname]
    form = json.loads(request.data)
    level = json.loads(form['level'])
    rules = game.rules_from_level(level)

    def check(concept):
        configstr = game.cset.aspify(concept) + rules
        return game.solver.analyze_level(configstr)

    rv = dict([(c.id, check(c)) for c in game.cset.concepts])
    return jsonify(concepts=rv)

if __name__ == '__main__':
    app.debug = True
    app.run(threaded=True)

