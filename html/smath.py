
from __future__ import absolute_import, print_function, unicode_literals

import numpy
from collections import namedtuple

Segment = namedtuple("Segment", ["xs", "xe", "poly"])

def catmulrom_matrix(s=0.5):
    return numpy.matrix([
        [ -s, 2-s,   s-2,  s],
        [2*s, s-3, 3-2*s, -s],
        [ -s,   0,     s,  0],
        [  0,   1,     0,  0]
    ])

def get_poly(mat, ctrl):
    vec = numpy.matrix([[x] for x in ctrl])
    coeffs = mat * vec
    return numpy.poly1d(coeffs.getA1())


def create_spline(cp):
    cy = [s[1] for s in cp]
    cy.insert(0, cy[0])
    cy.append(cy[-1])

    mat = catmulrom_matrix()
    polys = []

    for i in range(0, len(cy) - 3):
        polys.append(Segment(cp[i][0], cp[i+1][0], get_poly(mat, cy[i:i+4])))

    return polys

def eval_spline(spline, x):
        if x < spline[0].xs:
            return 0

        for seg in spline:
            if (x > seg.xe):
                continue
    		# otherwise we can assume this is the correct segment
            # compute correct t for this segment
            t = (float(x) - seg.xs) / (seg.xe - seg.xs)
            return seg.poly(t)
    	# if it's not in the range, just return nothing
    	return 0

