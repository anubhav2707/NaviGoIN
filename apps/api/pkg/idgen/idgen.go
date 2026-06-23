// Package idgen produces simple, prefixed IDs. New is for in-memory stub
// services that hold a sequence counter; Random is for DB-backed repositories
// where no in-process counter exists.
package idgen

import (
	"crypto/rand"
	"encoding/hex"
	"strconv"
	"time"
)

func New(prefix string, seq int) string {
	return prefix + "_" + time.Now().UTC().Format("20060102") + "_" + strconv.Itoa(seq)
}

// Random returns a collision-resistant ID like "usr_20260617_9f3a1c4e".
func Random(prefix string) string {
	b := make([]byte, 5)
	if _, err := rand.Read(b); err != nil {
		return New(prefix, int(time.Now().UnixNano()%1e9))
	}
	return prefix + "_" + time.Now().UTC().Format("20060102") + "_" + hex.EncodeToString(b)
}
